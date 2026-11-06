import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logActivity } from '../services/activity.service.js';
import { formatPhoneNumber } from '../services/whatsapp.service.js';

const router = express.Router();

// GET /api/users (List all employees / accounts)
router.get('/', authenticateToken, requireRole(['ADMIN', 'MANAGEMENT']), async (req, res) => {
  try {
    const { role, departmentId, search, status } = req.query;

    const where = {};
    if (role && role !== 'ALL') where.role = role;
    if (departmentId && departmentId !== 'ALL') where.departmentId = departmentId;
    if (status === 'ACTIVE') where.isActive = true;
    if (status === 'INACTIVE') where.isActive = false;

    if (search) {
      const s = search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { employeeId: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        canReceiveVisits: true,
        departmentId: true,
        department: {
          select: { id: true, name: true, code: true }
        },
        _count: {
          select: {
            visitsHosted: true,
            checkInsRecorded: true,
            checkOutsRecorded: true
          }
        },
        createdAt: true,
        updatedAt: true
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }]
    });

    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ error: 'Failed to retrieve employee records' });
  }
});

// GET /api/users/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: { department: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// POST /api/users (Create new employee/user, Admin only)
router.post('/', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const {
      employeeId,
      name,
      email,
      phone,
      password,
      role,
      departmentId,
      isActive,
      canReceiveVisits
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    if (existingEmail) {
      return res.status(409).json({ error: 'Email/username is already registered' });
    }

    if (employeeId) {
      const existingEmpId = await prisma.user.findUnique({
        where: { employeeId: employeeId.trim() }
      });
      if (existingEmpId) {
        return res.status(409).json({ error: 'Employee ID is already in use' });
      }
    }

    const formattedPhone = phone ? formatPhoneNumber(phone) : null;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        employeeId: employeeId ? employeeId.trim() : null,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: formattedPhone,
        password: hashedPassword,
        role: role || 'HOST_PIC',
        departmentId: departmentId || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        canReceiveVisits: canReceiveVisits !== undefined ? Boolean(canReceiveVisits) : true
      },
      include: { department: true }
    });

    await logActivity({
      userId: req.user.id,
      action: 'USER_CREATED',
      description: `Created new user ${newUser.name} (${newUser.role}, Dept: ${newUser.department?.name || '-'})`,
      req
    });

    const { password: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create employee record' });
  }
});

// PUT /api/users/:id (Update employee/user, Admin only)
router.put('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      employeeId,
      name,
      email,
      phone,
      role,
      departmentId,
      isActive,
      canReceiveVisits
    } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check email conflict
    if (email && email.toLowerCase().trim() !== existing.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      });
      if (emailConflict) {
        return res.status(409).json({ error: 'Email already in use by another user' });
      }
    }

    // Check employeeId conflict
    if (employeeId && employeeId.trim() !== existing.employeeId) {
      const empConflict = await prisma.user.findUnique({
        where: { employeeId: employeeId.trim() }
      });
      if (empConflict) {
        return res.status(409).json({ error: 'Employee ID already in use by another user' });
      }
    }

    const formattedPhone = phone ? formatPhoneNumber(phone) : null;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        employeeId: employeeId !== undefined ? (employeeId ? employeeId.trim() : null) : existing.employeeId,
        name: name ? name.trim() : existing.name,
        email: email ? email.toLowerCase().trim() : existing.email,
        phone: phone !== undefined ? formattedPhone : existing.phone,
        role: role || existing.role,
        departmentId: departmentId !== undefined ? departmentId : existing.departmentId,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        canReceiveVisits: canReceiveVisits !== undefined ? Boolean(canReceiveVisits) : existing.canReceiveVisits
      },
      include: { department: true }
    });

    await logActivity({
      userId: req.user.id,
      action: 'USER_UPDATED',
      description: `Updated employee info for ${updated.name} (Phone: ${updated.phone || '-'}, WA eligible: ${updated.canReceiveVisits})`,
      req
    });

    const { password: _, ...safeUser } = updated;
    res.json(safeUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// PUT /api/users/:id/password (Reset password)
router.put('/:id/password', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 5) {
      return res.status(400).json({ error: 'Password must be at least 5 characters' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updated = await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    await logActivity({
      userId: req.user.id,
      action: 'PASSWORD_RESET',
      description: `Reset password for user ${updated.name}`,
      req
    });

    res.json({ message: `Password reset successfully for ${updated.name}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// PATCH /api/users/:id/status (Toggle active/inactive)
router.patch('/:id/status', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
      include: { department: true }
    });

    await logActivity({
      userId: req.user.id,
      action: 'USER_STATUS_TOGGLED',
      description: `Set status of ${updated.name} to ${updated.isActive ? 'ACTIVE' : 'INACTIVE'}`,
      req
    });

    const { password: _, ...safeUser } = updated;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
});

export default router;


import Plan from '../models/Plan.js';
import { HR_ADMIN_ROLES, MANAGEMENT_ROLES, EXECUTIVE_ROLES } from '../constants/roles.js';

/**
 * @desc    Create a new plan
 * @route   POST /api/plans
 * @access  Private (Management/HR)
 */
export const createPlan = async (req, res) => {
  try {
    const {
      name,
      parentPlan = null,
      type,
      department,
      periodLabel,
      keyGoal,
      taskDetail,
      activity,
      expectedOutput,
      correctiveAction,
      progress = 0,
      priority = 'medium',
      description,
      kpis,
      target,
      budget = 0,
      leader,
      teams = [],
      tasks = [],
      planDate,
      startDate,
      endDate,
      supportTeams = [],
      supportTeamText,
      remark,
      note,
      documents = []
    } = req.body;

    if (!name || !type || !department) {
      return res.status(400).json({
        success: false,
        message: 'name, type, and department are required'
      });
    }

    const plan = await Plan.create({
      name,
      parentPlan: parentPlan || null,
      type,
      department,
      periodLabel,
      keyGoal,
      taskDetail,
      activity,
      expectedOutput,
      correctiveAction,
      progress: Number(progress) || 0,
      priority,
      description,
      kpis,
      target,
      budget: Number(budget),
      leader: leader || null,
      teams,
      tasks,
      planDate: planDate ? new Date(planDate) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status: Number(progress) > 0 && Number(progress) < 100 ? 'in_progress' : Number(progress) >= 100 ? 'completed' : 'draft',
      supportTeams,
      supportTeamText,
      remark,
      note,
      documents
    });

    const populated = await Plan.findById(plan._id)
      .populate('parentPlan', 'name type department status')
      .populate('leader', 'employeeNumber name department jobTitle')
      .populate('teams.employee', 'employeeNumber name department jobTitle')
      .populate('supportTeams.employee', 'employeeNumber name department jobTitle')
      .populate('tasks.assignedEmployee', 'employeeNumber name department jobTitle')
      .populate('tasks.doneBy', 'employeeNumber name department jobTitle')
      .populate('approvedBy', 'email roles');

    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get all plans (filterable)
 * @route   GET /api/plans
 * @access  Private
 */
export const getPlans = async (req, res) => {
  try {
    const { department, type, status, parentPlan, leader, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (parentPlan) filter.parentPlan = parentPlan;
    if (leader) filter.leader = leader;

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Plan.find(filter)
        .populate('parentPlan', 'name type department status')
        .populate('leader', 'employeeNumber name department jobTitle')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Plan.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get single plan by ID
 * @route   GET /api/plans/:id
 * @access  Private
 */
export const getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id)
      .populate('parentPlan', 'name type department status')
      .populate('leader', 'employeeNumber name department jobTitle')
      .populate('teams.employee', 'employeeNumber name department jobTitle')
      .populate('supportTeams.employee', 'employeeNumber name department jobTitle')
      .populate('tasks.assignedEmployee', 'employeeNumber name department jobTitle')
      .populate('tasks.doneBy', 'employeeNumber name department jobTitle')
      .populate('approvedBy', 'email roles')
      .populate('documents.uploadedBy', 'email roles');

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update a plan
 * @route   PATCH /api/plans/:id
 * @access  Private (Management/HR)
 */
export const updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    const fields = [
      'name',
      'parentPlan',
      'type',
      'department',
      'periodLabel',
      'keyGoal',
      'taskDetail',
      'activity',
      'expectedOutput',
      'correctiveAction',
      'progress',
      'priority',
      'description',
      'kpis',
      'target',
      'budget',
      'leader',
      'teams',
      'tasks',
      'planDate',
      'startDate',
      'endDate',
      'supportTeams',
      'supportTeamText',
      'remark',
      'note',
      'documents',
      'status'
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (['planDate', 'startDate', 'endDate'].includes(field)) {
          plan[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else {
          plan[field] = req.body[field];
        }
      }
    });

    await plan.save();

    const populated = await Plan.findById(plan._id)
      .populate('parentPlan', 'name type department status')
      .populate('leader', 'employeeNumber name department jobTitle')
      .populate('teams.employee', 'employeeNumber name department jobTitle')
      .populate('supportTeams.employee', 'employeeNumber name department jobTitle')
      .populate('tasks.assignedEmployee', 'employeeNumber name department jobTitle')
      .populate('tasks.doneBy', 'employeeNumber name department jobTitle')
      .populate('approvedBy', 'email roles');

    res.status(200).json({
      success: true,
      message: 'Plan updated successfully',
      data: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Approve or reject a plan
 * @route   PATCH /api/plans/:id/approval
 * @access  Private (Executive / HR Admin)
 */
export const updatePlanApproval = async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!['approved', 'rejected', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (approved, rejected, in_progress, completed, cancelled)'
      });
    }

    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    plan.status = status;
    if (status === 'approved') {
      plan.approvedBy = req.user._id;
      plan.approvedAt = new Date();
    }
    if (note !== undefined) plan.note = note;

    await plan.save();

    const populated = await Plan.findById(plan._id)
      .populate('parentPlan', 'name type department status')
      .populate('leader', 'employeeNumber name department jobTitle')
      .populate('approvedBy', 'email roles');

    res.status(200).json({
      success: true,
      message: `Plan status updated to ${status}`,
      data: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Add a task to a plan
 * @route   POST /api/plans/:id/tasks
 * @access  Private (Management/HR)
 */
export const addTask = async (req, res) => {
  try {
    const { title, description, checklist = [], assignedEmployee, dueDate } = req.body;
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required'
      });
    }

    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    plan.tasks.push({
      title,
      description,
      checklist,
      assignedEmployee: assignedEmployee || null,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: 'pending'
    });

    await plan.save();

    const populated = await Plan.findById(plan._id).populate(
      'tasks.assignedEmployee',
      'employeeNumber name department jobTitle'
    );

    res.status(200).json({
      success: true,
      message: 'Task added successfully',
      data: populated.tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update task details or checklist inside a plan
 * @route   PATCH /api/plans/:id/tasks/:taskId
 * @access  Private
 */
export const updateTask = async (req, res) => {
  try {
    const { title, description, checklist, assignedEmployee, doneBy, status, dueDate } = req.body;

    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    const task = plan.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (checklist !== undefined) task.checklist = checklist;
    if (assignedEmployee !== undefined) task.assignedEmployee = assignedEmployee;
    if (doneBy !== undefined) task.doneBy = doneBy;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;

    await plan.save();

    const populated = await Plan.findById(plan._id)
      .populate('tasks.assignedEmployee', 'employeeNumber name department jobTitle')
      .populate('tasks.doneBy', 'employeeNumber name department jobTitle');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: populated.tasks.id(req.params.taskId)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Add document to a plan
 * @route   POST /api/plans/:id/documents
 * @access  Private (Management/HR)
 */
export const addDocument = async (req, res) => {
  try {
    const { title, type = 'Other', url } = req.body;
    if (!title || !url) {
      return res.status(400).json({
        success: false,
        message: 'Document title and url are required'
      });
    }

    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    plan.documents.push({
      title,
      type,
      url,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    });

    await plan.save();

    res.status(200).json({
      success: true,
      message: 'Document added to plan successfully',
      data: plan.documents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete a plan
 * @route   DELETE /api/plans/:id
 * @access  Private (Executive / Management)
 */
export const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    await plan.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

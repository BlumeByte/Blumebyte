import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { toast } from 'sonner';
import { api } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import {
  Zap, Plus, Pencil, Trash2, Play, Pause, Clock, Bell, CheckCircle,
  AlertCircle, Settings, Filter, CalendarClock, GitBranch, RefreshCw,
  Loader2, Copy, Eye, TrendingUp, Mail, MessageSquare, Users, UserCheck,
  Target, FileText, Calendar, DollarSign, Award, ArrowRight, X, BarChart3
} from 'lucide-react';
import { MultiEmployeeSelect } from './MultiEmployeeSelect';

// Workflow types and triggers
const WORKFLOW_TRIGGERS = [
  { value: 'leave_request', label: 'Leave Request Submitted', icon: Calendar },
  { value: 'attendance_late', label: 'Employee Late Arrival', icon: Clock },
  { value: 'attendance_absent', label: 'Employee Absent', icon: AlertCircle },
  { value: 'expense_submitted', label: 'Expense Report Submitted', icon: DollarSign },
  { value: 'timesheet_submitted', label: 'Timesheet Submitted', icon: Clock },
  { value: 'profile_change', label: 'Profile Change Request', icon: UserCheck },
  { value: 'task_overdue', label: 'Task Overdue', icon: AlertCircle },
  { value: 'performance_review_due', label: 'Performance Review Due', icon: Target },
  { value: 'document_uploaded', label: 'Document Uploaded', icon: FileText },
  { value: 'new_hire', label: 'New Employee Hired', icon: Users },
  { value: 'employee_anniversary', label: 'Work Anniversary', icon: Award },
  { value: 'probation_ending', label: 'Probation Period Ending', icon: CheckCircle },
  { value: 'contract_expiring', label: 'Contract Expiring Soon', icon: AlertCircle },
  { value: 'training_due', label: 'Training Due', icon: Award },
];

const WORKFLOW_ACTIONS = [
  { value: 'send_notification', label: 'Send Notification', icon: Bell },
  { value: 'send_email', label: 'Send Email', icon: Mail },
  { value: 'auto_approve', label: 'Auto Approve', icon: CheckCircle },
  { value: 'require_approval', label: 'Require Approval From', icon: UserCheck },
  { value: 'assign_task', label: 'Assign Task', icon: Target },
  { value: 'update_status', label: 'Update Status', icon: RefreshCw },
  { value: 'escalate', label: 'Escalate to Manager', icon: ArrowRight },
  { value: 'create_report', label: 'Generate Report', icon: FileText },
];

const NOTIFICATION_CHANNELS = [
  { value: 'in_app', label: 'In-App Notification' },
  { value: 'email', label: 'Email' },
  { value: 'both', label: 'Both' },
];

const SCHEDULE_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

interface AutomationModuleProps {
  companyId?: string;
}

export function AutomationModule({ companyId }: AutomationModuleProps) {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState('workflows');
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<any[]>([]);
  const [businessRules, setBusinessRules] = useState<any[]>([]);
  const [notificationTemplates, setNotificationTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);

  // Workflow form state
  const [workflowForm, setWorkflowForm] = useState({
    name: '',
    description: '',
    trigger: '',
    conditions: [] as any[],
    actions: [] as any[],
    enabled: true,
  });

  // Scheduled task form state
  const [taskForm, setTaskForm] = useState({
    name: '',
    description: '',
    frequency: 'daily',
    time: '09:00',
    action: '',
    targetUsers: [] as string[],
    enabled: true,
  });

  // Business rule form state
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    category: '',
    field: '',
    operator: '',
    value: '',
    action: '',
    enabled: true,
  });

  // Notification template form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    body: '',
    channel: 'in_app',
    trigger: '',
  });

  // Load data whenever accessToken becomes available
  useEffect(() => {
    if (accessToken) {
      loadData();
    }
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setLoading(true);
    try {
      const [workflowsRes, tasksRes, rulesRes, templatesRes, employeesRes] = await Promise.all([
        api('/automation/workflows', { token: accessToken }).catch(() => ({ data: [] })),
        api('/automation/scheduled-tasks', { token: accessToken }).catch(() => ({ data: [] })),
        api('/automation/business-rules', { token: accessToken }).catch(() => ({ data: [] })),
        api('/automation/notification-templates', { token: accessToken }).catch(() => ({ data: [] })),
        api('/employees', { token: accessToken }).catch(() => []),
      ]);

      setWorkflows(Array.isArray(workflowsRes?.data) ? workflowsRes.data : (Array.isArray(workflowsRes) ? workflowsRes : []));
      setScheduledTasks(Array.isArray(tasksRes?.data) ? tasksRes.data : (Array.isArray(tasksRes) ? tasksRes : []));
      setBusinessRules(Array.isArray(rulesRes?.data) ? rulesRes.data : (Array.isArray(rulesRes) ? rulesRes : []));
      setNotificationTemplates(Array.isArray(templatesRes?.data) ? templatesRes.data : (Array.isArray(templatesRes) ? templatesRes : []));
      setAllEmployees(Array.isArray(employeesRes) ? employeesRes : []);
    } catch (error: any) {
      console.error('Error loading automation data:', error);
      toast.error('Failed to load automation data');
    } finally {
      setLoading(false);
    }
  };

  // Workflow handlers
  const handleCreateWorkflow = () => {
    setEditingItem(null);
    setWorkflowForm({
      name: '',
      description: '',
      trigger: '',
      conditions: [],
      actions: [],
      enabled: true,
    });
    setShowWorkflowDialog(true);
  };

  const handleEditWorkflow = (workflow: any) => {
    setEditingItem(workflow);
    setWorkflowForm({
      name: workflow.name || '',
      description: workflow.description || '',
      trigger: workflow.trigger || '',
      conditions: workflow.conditions || [],
      actions: workflow.actions || [],
      enabled: workflow.enabled !== false,
    });
    setShowWorkflowDialog(true);
  };

  const handleSaveWorkflow = async () => {
    if (!workflowForm.name || !workflowForm.trigger) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const workflowData = {
        ...workflowForm,
        companyId,
        createdAt: editingItem?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingItem) {
        await api(`/automation/workflows/${editingItem.id}`, { method: 'PUT', body: workflowData, token: accessToken });
        toast.success('Workflow updated successfully');
      } else {
        await api('/automation/workflows', { method: 'POST', body: workflowData, token: accessToken });
        toast.success('Workflow created successfully');
      }

      setShowWorkflowDialog(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving workflow:', error);
      toast.error(error.message || 'Failed to save workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWorkflow = async (workflow: any) => {
    try {
      await api(`/automation/workflows/${workflow.id}`, {
        method: 'PUT',
        body: { ...workflow, enabled: !workflow.enabled },
        token: accessToken
      });
      toast.success(`Workflow ${workflow.enabled ? 'disabled' : 'enabled'}`);
      loadData();
    } catch (error: any) {
      console.error('Error toggling workflow:', error);
      toast.error('Failed to toggle workflow');
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      await api(`/automation/workflows/${id}`, { method: 'DELETE', token: accessToken });
      toast.success('Workflow deleted successfully');
      loadData();
    } catch (error: any) {
      console.error('Error deleting workflow:', error);
      toast.error('Failed to delete workflow');
    }
  };

  // Scheduled task handlers
  const handleCreateTask = () => {
    setEditingItem(null);
    setTaskForm({
      name: '',
      description: '',
      frequency: 'daily',
      time: '09:00',
      action: '',
      targetUsers: [],
      enabled: true,
    });
    setShowTaskDialog(true);
  };

  const handleEditTask = (task: any) => {
    setEditingItem(task);
    setTaskForm({
      name: task.name || '',
      description: task.description || '',
      frequency: task.frequency || 'daily',
      time: task.time || '09:00',
      action: task.action || '',
      targetUsers: task.targetUsers || [],
      enabled: task.enabled !== false,
    });
    setShowTaskDialog(true);
  };

  const handleSaveTask = async () => {
    if (!taskForm.name || !taskForm.action) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        ...taskForm,
        companyId,
        createdAt: editingItem?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRun: editingItem?.lastRun,
        nextRun: calculateNextRun(taskForm.frequency, taskForm.time),
      };

      if (editingItem) {
        await api(`/automation/scheduled-tasks/${editingItem.id}`, { method: 'PUT', body: taskData, token: accessToken });
        toast.success('Scheduled task updated successfully');
      } else {
        await api('/automation/scheduled-tasks', { method: 'POST', body: taskData, token: accessToken });
        toast.success('Scheduled task created successfully');
      }

      setShowTaskDialog(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving task:', error);
      toast.error(error.message || 'Failed to save scheduled task');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (task: any) => {
    try {
      await api(`/automation/scheduled-tasks/${task.id}`, {
        method: 'PUT',
        body: { ...task, enabled: !task.enabled },
        token: accessToken
      });
      toast.success(`Task ${task.enabled ? 'disabled' : 'enabled'}`);
      loadData();
    } catch (error: any) {
      console.error('Error toggling task:', error);
      toast.error('Failed to toggle task');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled task?')) return;

    try {
      await api(`/automation/scheduled-tasks/${id}`, { method: 'DELETE', token: accessToken });
      toast.success('Scheduled task deleted successfully');
      loadData();
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete scheduled task');
    }
  };

  // Business rule handlers
  const handleCreateRule = () => {
    setEditingItem(null);
    setRuleForm({
      name: '',
      description: '',
      category: '',
      field: '',
      operator: '',
      value: '',
      action: '',
      enabled: true,
    });
    setShowRuleDialog(true);
  };

  const handleEditRule = (rule: any) => {
    setEditingItem(rule);
    setRuleForm({
      name: rule.name || '',
      description: rule.description || '',
      category: rule.category || '',
      field: rule.field || '',
      operator: rule.operator || '',
      value: rule.value || '',
      action: rule.action || '',
      enabled: rule.enabled !== false,
    });
    setShowRuleDialog(true);
  };

  const handleSaveRule = async () => {
    if (!ruleForm.name || !ruleForm.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const ruleData = {
        ...ruleForm,
        companyId,
        createdAt: editingItem?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingItem) {
        await api(`/automation/business-rules/${editingItem.id}`, { method: 'PUT', body: ruleData, token: accessToken });
        toast.success('Business rule updated successfully');
      } else {
        await api('/automation/business-rules', { method: 'POST', body: ruleData, token: accessToken });
        toast.success('Business rule created successfully');
      }

      setShowRuleDialog(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving rule:', error);
      toast.error(error.message || 'Failed to save business rule');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this business rule?')) return;

    try {
      await api(`/automation/business-rules/${id}`, { method: 'DELETE', token: accessToken });
      toast.success('Business rule deleted successfully');
      loadData();
    } catch (error: any) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete business rule');
    }
  };

  // Notification template handlers
  const handleCreateTemplate = () => {
    setEditingItem(null);
    setTemplateForm({
      name: '',
      subject: '',
      body: '',
      channel: 'in_app',
      trigger: '',
    });
    setShowTemplateDialog(true);
  };

  const handleEditTemplate = (template: any) => {
    setEditingItem(template);
    setTemplateForm({
      name: template.name || '',
      subject: template.subject || '',
      body: template.body || '',
      channel: template.channel || 'in_app',
      trigger: template.trigger || '',
    });
    setShowTemplateDialog(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.body) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const templateData = {
        ...templateForm,
        companyId,
        createdAt: editingItem?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingItem) {
        await api(`/automation/notification-templates/${editingItem.id}`, { method: 'PUT', body: templateData, token: accessToken });
        toast.success('Template updated successfully');
      } else {
        await api('/automation/notification-templates', { method: 'POST', body: templateData, token: accessToken });
        toast.success('Template created successfully');
      }

      setShowTemplateDialog(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(error.message || 'Failed to save notification template');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await api(`/automation/notification-templates/${id}`, { method: 'DELETE', token: accessToken });
      toast.success('Template deleted successfully');
      loadData();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  // Helper functions
  const calculateNextRun = (frequency: string, time: string) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);

    if (next <= now) {
      switch (frequency) {
        case 'daily':
          next.setDate(next.getDate() + 1);
          break;
        case 'weekly':
          next.setDate(next.getDate() + 7);
          break;
        case 'monthly':
          next.setMonth(next.getMonth() + 1);
          break;
        case 'quarterly':
          next.setMonth(next.getMonth() + 3);
          break;
        case 'yearly':
          next.setFullYear(next.getFullYear() + 1);
          break;
      }
    }

    return next.toISOString();
  };

  const addCondition = () => {
    setWorkflowForm({
      ...workflowForm,
      conditions: [
        ...workflowForm.conditions,
        { field: '', operator: 'equals', value: '' },
      ],
    });
  };

  const updateCondition = (index: number, field: string, value: any) => {
    const newConditions = [...workflowForm.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setWorkflowForm({ ...workflowForm, conditions: newConditions });
  };

  const removeCondition = (index: number) => {
    setWorkflowForm({
      ...workflowForm,
      conditions: workflowForm.conditions.filter((_, i) => i !== index),
    });
  };

  const addAction = () => {
    setWorkflowForm({
      ...workflowForm,
      actions: [
        ...workflowForm.actions,
        { type: '', config: {} },
      ],
    });
  };

  const updateAction = (index: number, field: string, value: any) => {
    const newActions = [...workflowForm.actions];
    if (field === 'type') {
      newActions[index] = { type: value, config: {} };
    } else {
      newActions[index] = {
        ...newActions[index],
        config: { ...newActions[index].config, [field]: value },
      };
    }
    setWorkflowForm({ ...workflowForm, actions: newActions });
  };

  const removeAction = (index: number) => {
    setWorkflowForm({
      ...workflowForm,
      actions: workflowForm.actions.filter((_, i) => i !== index),
    });
  };

  // Statistics
  const stats = {
    activeWorkflows: workflows.filter(w => w.enabled).length,
    totalWorkflows: workflows.length,
    activeTasks: scheduledTasks.filter(t => t.enabled).length,
    totalTasks: scheduledTasks.length,
    activeRules: businessRules.filter(r => r.enabled).length,
    totalRules: businessRules.length,
    totalTemplates: notificationTemplates.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Automation & Workflows
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Automate repetitive tasks and streamline your HR processes
          </p>
        </div>
        <Button onClick={() => loadData()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Workflows</p>
                <p className="text-2xl font-bold mt-1">
                  {stats.activeWorkflows}/{stats.totalWorkflows}
                </p>
              </div>
              <GitBranch className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Scheduled Tasks</p>
                <p className="text-2xl font-bold mt-1">
                  {stats.activeTasks}/{stats.totalTasks}
                </p>
              </div>
              <CalendarClock className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Business Rules</p>
                <p className="text-2xl font-bold mt-1">
                  {stats.activeRules}/{stats.totalRules}
                </p>
              </div>
              <Settings className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Notification Templates</p>
                <p className="text-2xl font-bold mt-1">{stats.totalTemplates}</p>
              </div>
              <Bell className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflows">
            <GitBranch className="w-4 h-4 mr-2" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <CalendarClock className="w-4 h-4 mr-2" />
            Scheduled Tasks
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Settings className="w-4 h-4 mr-2" />
            Business Rules
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Bell className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} configured
            </p>
            <Button onClick={handleCreateWorkflow}>
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : workflows.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-400">
                <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No workflows configured yet</p>
                <Button onClick={handleCreateWorkflow} variant="outline" className="mt-4">
                  Create Your First Workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {workflows.map((workflow) => (
                <Card key={workflow.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{workflow.name}</h3>
                          <Badge variant={workflow.enabled ? 'default' : 'secondary'}>
                            {workflow.enabled ? (
                              <>
                                <Play className="w-3 h-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <Pause className="w-3 h-3 mr-1" />
                                Paused
                              </>
                            )}
                          </Badge>
                          <Badge variant="outline">
                            {WORKFLOW_TRIGGERS.find(t => t.value === workflow.trigger)?.label || workflow.trigger}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">{workflow.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Filter className="w-4 h-4" />
                            {workflow.conditions?.length || 0} condition{workflow.conditions?.length !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="w-4 h-4" />
                            {workflow.actions?.length || 0} action{workflow.actions?.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleWorkflow(workflow)}
                        >
                          {workflow.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditWorkflow(workflow)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Scheduled Tasks Tab */}
        <TabsContent value="scheduled" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {scheduledTasks.length} scheduled task{scheduledTasks.length !== 1 ? 's' : ''}
            </p>
            <Button onClick={handleCreateTask}>
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : scheduledTasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-400">
                <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No scheduled tasks configured yet</p>
                <Button onClick={handleCreateTask} variant="outline" className="mt-4">
                  Create Your First Scheduled Task
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {scheduledTasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{task.name}</h3>
                          <Badge variant={task.enabled ? 'default' : 'secondary'}>
                            {task.enabled ? 'Active' : 'Paused'}
                          </Badge>
                          <Badge variant="outline">{task.frequency}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">{task.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {task.time}
                          </span>
                          {task.lastRun && (
                            <span className="flex items-center gap-1">
                              Last run: {new Date(task.lastRun).toLocaleDateString()}
                            </span>
                          )}
                          {task.nextRun && (
                            <span className="flex items-center gap-1">
                              Next run: {new Date(task.nextRun).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleTask(task)}
                        >
                          {task.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTask(task)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Business Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {businessRules.length} business rule{businessRules.length !== 1 ? 's' : ''}
            </p>
            <Button onClick={handleCreateRule}>
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : businessRules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-400">
                <Settings className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No business rules configured yet</p>
                <Button onClick={handleCreateRule} variant="outline" className="mt-4">
                  Create Your First Business Rule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {businessRules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{rule.name}</h3>
                          <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                            {rule.enabled ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">{rule.category}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{rule.description}</p>
                        <div className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                          IF {rule.field} {rule.operator} "{rule.value}" THEN {rule.action}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRule(rule)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notification Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {notificationTemplates.length} template{notificationTemplates.length !== 1 ? 's' : ''}
            </p>
            <Button onClick={handleCreateTemplate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : notificationTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No notification templates yet</p>
                <Button onClick={handleCreateTemplate} variant="outline" className="mt-4">
                  Create Your First Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notificationTemplates.map((template) => (
                <Card key={template.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{template.name}</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{template.channel}</Badge>
                          {template.trigger && (
                            <Badge variant="secondary">{template.trigger}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    {template.subject && (
                      <p className="text-sm font-medium mb-1">{template.subject}</p>
                    )}
                    <p className="text-sm text-gray-500 line-clamp-2">{template.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Workflow Dialog */}
      <Dialog open={showWorkflowDialog} onOpenChange={setShowWorkflowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Workflow' : 'Create New Workflow'}
            </DialogTitle>
            <DialogDescription>
              Configure automated workflows for your HR processes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Workflow Name *</Label>
              <Input
                value={workflowForm.name}
                onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
                placeholder="e.g., Auto-approve short leave requests"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={workflowForm.description}
                onChange={(e) => setWorkflowForm({ ...workflowForm, description: e.target.value })}
                placeholder="Describe what this workflow does..."
                rows={2}
              />
            </div>

            <div>
              <Label>Trigger *</Label>
              <Select
                value={workflowForm.trigger}
                onValueChange={(value) => setWorkflowForm({ ...workflowForm, trigger: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger event..." />
                </SelectTrigger>
                <SelectContent>
                  {WORKFLOW_TRIGGERS.map((trigger) => (
                    <SelectItem key={trigger.value} value={trigger.value}>
                      {trigger.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Conditions</Label>
                <Button variant="outline" size="sm" onClick={addCondition}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Condition
                </Button>
              </div>
              <div className="space-y-2">
                {workflowForm.conditions.map((condition, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded">
                    <Input
                      placeholder="Field name"
                      value={condition.field}
                      onChange={(e) => updateCondition(index, 'field', e.target.value)}
                      className="flex-1"
                    />
                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateCondition(index, 'operator', value)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="not_equals">Not Equals</SelectItem>
                        <SelectItem value="greater_than">Greater Than</SelectItem>
                        <SelectItem value="less_than">Less Than</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Value"
                      value={condition.value}
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Actions *</Label>
                <Button variant="outline" size="sm" onClick={addAction}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Action
                </Button>
              </div>
              <div className="space-y-2">
                {workflowForm.actions.map((action, index) => (
                  <div key={index} className="p-3 border rounded space-y-2">
                    <div className="flex items-center gap-2">
                      <Select
                        value={action.type}
                        onValueChange={(value) => updateAction(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select action..." />
                        </SelectTrigger>
                        <SelectContent>
                          {WORKFLOW_ACTIONS.map((act) => (
                            <SelectItem key={act.value} value={act.value}>
                              {act.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAction(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {action.type === 'send_notification' && (
                      <Textarea
                        placeholder="Notification message..."
                        value={action.config.message || ''}
                        onChange={(e) => updateAction(index, 'message', e.target.value)}
                        rows={2}
                      />
                    )}

                    {action.type === 'send_email' && (
                      <>
                        <Input
                          placeholder="Subject"
                          value={action.config.subject || ''}
                          onChange={(e) => updateAction(index, 'subject', e.target.value)}
                        />
                        <Textarea
                          placeholder="Email body..."
                          value={action.config.body || ''}
                          onChange={(e) => updateAction(index, 'body', e.target.value)}
                          rows={3}
                        />
                      </>
                    )}

                    {action.type === 'require_approval' && (
                      <Input
                        placeholder="Approver role (e.g., manager, admin)"
                        value={action.config.approverRole || ''}
                        onChange={(e) => updateAction(index, 'approverRole', e.target.value)}
                      />
                    )}

                    {action.type === 'update_status' && (
                      <Input
                        placeholder="New status"
                        value={action.config.status || ''}
                        onChange={(e) => updateAction(index, 'status', e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={workflowForm.enabled}
                onCheckedChange={(checked) => setWorkflowForm({ ...workflowForm, enabled: checked })}
              />
              <Label>Enable this workflow</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWorkflowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveWorkflow} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingItem ? 'Update' : 'Create'} Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scheduled Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Scheduled Task' : 'Create Scheduled Task'}
            </DialogTitle>
            <DialogDescription>
              Schedule recurring automated tasks
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Task Name *</Label>
              <Input
                value={taskForm.name}
                onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                placeholder="e.g., Send weekly attendance report"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Describe what this task does..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Frequency *</Label>
                <Select
                  value={taskForm.frequency}
                  onValueChange={(value) => setTaskForm({ ...taskForm, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Time *</Label>
                <Input
                  type="time"
                  value={taskForm.time}
                  onChange={(e) => setTaskForm({ ...taskForm, time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Action *</Label>
              <Select
                value={taskForm.action}
                onValueChange={(value) => setTaskForm({ ...taskForm, action: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action..." />
                </SelectTrigger>
                <SelectContent>
                  {WORKFLOW_ACTIONS.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Target Users (Optional)</Label>
              <MultiEmployeeSelect
                employees={allEmployees}
                selectedIds={taskForm.targetUsers}
                onChange={(ids) => setTaskForm({ ...taskForm, targetUsers: ids })}
                placeholder="Select target users..."
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={taskForm.enabled}
                onCheckedChange={(checked) => setTaskForm({ ...taskForm, enabled: checked })}
              />
              <Label>Enable this task</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTask} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingItem ? 'Update' : 'Create'} Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Business Rule Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Business Rule' : 'Create Business Rule'}
            </DialogTitle>
            <DialogDescription>
              Define business rules for automated decision-making
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Rule Name *</Label>
              <Input
                value={ruleForm.name}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                placeholder="e.g., Auto-approve leave under 3 days"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={ruleForm.description}
                onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                placeholder="Describe this rule..."
                rows={2}
              />
            </div>

            <div>
              <Label>Category *</Label>
              <Select
                value={ruleForm.category}
                onValueChange={(value) => setRuleForm({ ...ruleForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leave">Leave Management</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="approval">Approval</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Field</Label>
                <Input
                  value={ruleForm.field}
                  onChange={(e) => setRuleForm({ ...ruleForm, field: e.target.value })}
                  placeholder="e.g., days"
                />
              </div>

              <div>
                <Label>Operator</Label>
                <Select
                  value={ruleForm.operator}
                  onValueChange={(value) => setRuleForm({ ...ruleForm, operator: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">=</SelectItem>
                    <SelectItem value="not_equals">≠</SelectItem>
                    <SelectItem value="greater_than">&gt;</SelectItem>
                    <SelectItem value="less_than">&lt;</SelectItem>
                    <SelectItem value="greater_or_equal">≥</SelectItem>
                    <SelectItem value="less_or_equal">≤</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Value</Label>
                <Input
                  value={ruleForm.value}
                  onChange={(e) => setRuleForm({ ...ruleForm, value: e.target.value })}
                  placeholder="e.g., 3"
                />
              </div>
            </div>

            <div>
              <Label>Action</Label>
              <Select
                value={ruleForm.action}
                onValueChange={(value) => setRuleForm({ ...ruleForm, action: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action..." />
                </SelectTrigger>
                <SelectContent>
                  {WORKFLOW_ACTIONS.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={ruleForm.enabled}
                onCheckedChange={(checked) => setRuleForm({ ...ruleForm, enabled: checked })}
              />
              <Label>Enable this rule</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingItem ? 'Update' : 'Create'} Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Template' : 'Create Notification Template'}
            </DialogTitle>
            <DialogDescription>
              Create reusable notification templates
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Template Name *</Label>
              <Input
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder="e.g., Leave Approved Notification"
              />
            </div>

            <div>
              <Label>Channel</Label>
              <Select
                value={templateForm.channel}
                onValueChange={(value) => setTemplateForm({ ...templateForm, channel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_CHANNELS.map((channel) => (
                    <SelectItem key={channel.value} value={channel.value}>
                      {channel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Trigger (Optional)</Label>
              <Select
                value={templateForm.trigger}
                onValueChange={(value) => setTemplateForm({ ...templateForm, trigger: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger..." />
                </SelectTrigger>
                <SelectContent>
                  {WORKFLOW_TRIGGERS.map((trigger) => (
                    <SelectItem key={trigger.value} value={trigger.value}>
                      {trigger.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(templateForm.channel === 'email' || templateForm.channel === 'both') && (
              <div>
                <Label>Email Subject</Label>
                <Input
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  placeholder="e.g., Your leave request has been approved"
                />
              </div>
            )}

            <div>
              <Label>Message Body *</Label>
              <Textarea
                value={templateForm.body}
                onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                placeholder="Use {{variables}} for dynamic content, e.g., Hello {{employeeName}}, your leave from {{startDate}} to {{endDate}} has been approved."
                rows={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                {"Available variables: {{employeeName}}, {{managerName}}, {{startDate}}, {{endDate}}, {{status}}, {{reason}}"}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingItem ? 'Update' : 'Create'} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

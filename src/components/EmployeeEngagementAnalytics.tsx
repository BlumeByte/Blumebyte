import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { ClientOnlyChart } from './ClientOnlyChart';
import { useCurrency } from '../lib/currency-context';

export function EmployeeEngagementAnalytics() {
  const { accessToken } = useAuth();
  const { currencySymbol } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<any>({
    overtime: [],
    expenses: [],
    training: [],
    surveys: [],
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [overtimeData, expenseData, trainingData, surveyData] = await Promise.all([
        api('/admin/overtime-requests', { token: accessToken }).catch(() => []),
        api('/admin/expense-claims', { token: accessToken }).catch(() => []),
        api('/admin/training-programs', { token: accessToken }).catch(() => []),
        api('/admin/surveys', { token: accessToken }).catch(() => []),
      ]);
      
      setData({
        overtime: Array.isArray(overtimeData) ? overtimeData : [],
        expenses: Array.isArray(expenseData) ? expenseData : [],
        training: Array.isArray(trainingData) ? trainingData : [],
        surveys: Array.isArray(surveyData) ? surveyData : [],
      });
    } catch (e) {
      console.error('Load engagement analytics error:', e);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate overtime metrics
  const overtimeMetrics = {
    total: data.overtime.length,
    pending: data.overtime.filter((r: any) => r.status === 'pending').length,
    approved: data.overtime.filter((r: any) => r.status === 'approved').length,
    rejected: data.overtime.filter((r: any) => r.status === 'rejected').length,
    totalHours: data.overtime.reduce((sum: number, r: any) => sum + (r.hours || 0), 0),
    totalCost: data.overtime.reduce((sum: number, r: any) => sum + ((r.hours || 0) * (r.rate || 0)), 0),
  };

  // Calculate expense metrics
  const expenseMetrics = {
    total: data.expenses.length,
    pending: data.expenses.filter((e: any) => e.status === 'pending').length,
    approved: data.expenses.filter((e: any) => e.status === 'approved').length,
    rejected: data.expenses.filter((e: any) => e.status === 'rejected').length,
    totalAmount: data.expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0),
    approvedAmount: data.expenses
      .filter((e: any) => e.status === 'approved')
      .reduce((sum: number, e: any) => sum + (e.amount || 0), 0),
  };

  // Calculate training metrics
  const trainingMetrics = {
    totalPrograms: data.training.length,
    activePrograms: data.training.filter((t: any) => t.status === 'active' || t.status === 'Active').length,
    completedPrograms: data.training.filter((t: any) => t.status === 'completed').length,
  };

  // Calculate survey metrics
  const surveyMetrics = {
    total: data.surveys.length,
    active: data.surveys.filter((s: any) => s.status === 'active').length,
    draft: data.surveys.filter((s: any) => s.status === 'draft').length,
    closed: data.surveys.filter((s: any) => s.status === 'closed').length,
  };

  // Overtime by month chart data
  const overtimeByMonth = data.overtime.reduce((acc: any, req: any) => {
    if (!req.date) return acc;
    const month = new Date(req.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = { month, hours: 0, cost: 0, count: 0 };
    }
    acc[month].hours += req.hours || 0;
    acc[month].cost += (req.hours || 0) * (req.rate || 0);
    acc[month].count += 1;
    return acc;
  }, {});
  const overtimeChartData = Object.values(overtimeByMonth).slice(-6);

  // Expense by category chart data
  const expenseByCategory = data.expenses.reduce((acc: any, exp: any) => {
    const category = exp.category || 'Other';
    if (!acc[category]) {
      acc[category] = { name: category, value: 0, count: 0 };
    }
    acc[category].value += exp.amount || 0;
    acc[category].count += 1;
    return acc;
  }, {});
  const expenseCategoryData = Object.values(expenseByCategory);

  // Overtime status distribution
  const overtimeStatusData = [
    { name: 'Pending', value: overtimeMetrics.pending, fill: '#f59e0b' },
    { name: 'Approved', value: overtimeMetrics.approved, fill: '#10b981' },
    { name: 'Rejected', value: overtimeMetrics.rejected, fill: '#ef4444' },
  ].filter(d => d.value > 0);

  // Expense status distribution
  const expenseStatusData = [
    { name: 'Pending', value: expenseMetrics.pending, fill: '#f59e0b' },
    { name: 'Approved', value: expenseMetrics.approved, fill: '#10b981' },
    { name: 'Rejected', value: expenseMetrics.rejected, fill: '#ef4444' },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Employee Engagement Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Insights into overtime, expenses, training, and surveys
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="w-4 h-4 mr-2 text-blue-600" />
              Overtime Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overtimeMetrics.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overtimeMetrics.totalHours.toFixed(1)} hours total
            </p>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-yellow-100 text-yellow-800">{overtimeMetrics.pending} pending</Badge>
              <Badge className="bg-green-100 text-green-800">{overtimeMetrics.approved} approved</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-green-600" />
              Expense Claims
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenseMetrics.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {currencySymbol}{expenseMetrics.totalAmount.toLocaleString()} total
            </p>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-yellow-100 text-yellow-800">{expenseMetrics.pending} pending</Badge>
              <Badge className="bg-green-100 text-green-800">{expenseMetrics.approved} approved</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <GraduationCap className="w-4 h-4 mr-2 text-purple-600" />
              Training Programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainingMetrics.totalPrograms}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {trainingMetrics.activePrograms} active programs
            </p>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-purple-100 text-purple-800">
                {trainingMetrics.completedPrograms} completed
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <ClipboardList className="w-4 h-4 mr-2 text-indigo-600" />
              Surveys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{surveyMetrics.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {surveyMetrics.active} active surveys
            </p>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-gray-100 text-gray-800">{surveyMetrics.draft} drafts</Badge>
              <Badge className="bg-indigo-100 text-indigo-800">{surveyMetrics.closed} closed</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="overtime">Overtime</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overtime Trends (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                {overtimeChartData.length > 0 ? (
                  <ClientOnlyChart
                    type="bar"
                    data={overtimeChartData}
                    xKey="month"
                    yKeys={[{ key: 'hours', name: 'Hours', color: '#3b82f6' }]}
                    height={250}
                  />
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No overtime data
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Expense Categories</CardTitle>
              </CardHeader>
              <CardContent>
                {expenseCategoryData.length > 0 ? (
                  <ClientOnlyChart
                    type="pie"
                    data={expenseCategoryData}
                    height={250}
                  />
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No expense data
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overtime Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {overtimeStatusData.length > 0 ? (
                  <ClientOnlyChart
                    type="pie"
                    data={overtimeStatusData}
                    height={250}
                  />
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No overtime requests
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Expense Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {expenseStatusData.length > 0 ? (
                  <ClientOnlyChart
                    type="pie"
                    data={expenseStatusData}
                    height={250}
                  />
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No expense claims
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Overtime Cost</p>
                    <p className="text-sm text-muted-foreground">
                      Total overtime cost: {currencySymbol}{overtimeMetrics.totalCost.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Expense Reimbursements</p>
                    <p className="text-sm text-muted-foreground">
                      Approved expenses: {currencySymbol}{expenseMetrics.approvedAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Training Engagement</p>
                    <p className="text-sm text-muted-foreground">
                      {trainingMetrics.activePrograms} active training programs available
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium">Employee Feedback</p>
                    <p className="text-sm text-muted-foreground">
                      {surveyMetrics.active} active surveys collecting employee feedback
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overtime" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overtime Hours by Month</CardTitle>
              </CardHeader>
              <CardContent>
                {overtimeChartData.length > 0 ? (
                  <ClientOnlyChart
                    type="line"
                    data={overtimeChartData}
                    xKey="month"
                    yKeys={[{ key: 'hours', name: 'Hours', color: '#3b82f6' }]}
                    height={300}
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overtime Cost by Month</CardTitle>
              </CardHeader>
              <CardContent>
                {overtimeChartData.length > 0 ? (
                  <ClientOnlyChart
                    type="bar"
                    data={overtimeChartData}
                    xKey="month"
                    yKeys={[{ key: 'cost', name: `Cost (${currencySymbol})`, color: '#10b981' }]}
                    height={300}
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {expenseCategoryData.length > 0 ? (
                  <ClientOnlyChart
                    type="bar"
                    data={expenseCategoryData}
                    xKey="name"
                    yKeys={[{ key: 'value', name: `Amount (${currencySymbol})`, color: '#3b82f6' }]}
                    height={300}
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Expense Approval Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Approval Rate</span>
                      <span className="text-sm font-medium">
                        {expenseMetrics.total > 0
                          ? ((expenseMetrics.approved / expenseMetrics.total) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all"
                        style={{
                          width: `${expenseMetrics.total > 0 ? (expenseMetrics.approved / expenseMetrics.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">{expenseMetrics.pending}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{expenseMetrics.approved}</p>
                      <p className="text-xs text-muted-foreground">Approved</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{expenseMetrics.rejected}</p>
                      <p className="text-xs text-muted-foreground">Rejected</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Training Program Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-purple-100 flex items-center justify-center mb-2">
                    <GraduationCap className="w-8 h-8 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold">{trainingMetrics.totalPrograms}</p>
                  <p className="text-sm text-muted-foreground">Total Programs</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold">{trainingMetrics.activePrograms}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-2">
                    <Award className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold">{trainingMetrics.completedPrograms}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
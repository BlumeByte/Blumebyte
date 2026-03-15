import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Plus, MessageSquare, BarChart3, TrendingUp, Users, Heart, Star } from 'lucide-react';
import { format } from 'date-fns';

interface Survey {
  id: string;
  title: string;
  description: string;
  type: 'anonymous' | 'identified';
  status: 'draft' | 'active' | 'closed';
  createdBy: string;
  createdDate: Date;
  responses: number;
  questions: SurveyQuestion[];
}

interface SurveyQuestion {
  id: string;
  type: 'multiple-choice' | 'rating' | 'text' | 'yes-no';
  question: string;
  options?: string[];
  required: boolean;
}

interface SurveyResponse {
  id: string;
  surveyId: string;
  respondentId?: string;
  submittedDate: Date;
  answers: { [questionId: string]: any };
}

interface Suggestion {
  id: string;
  category: 'hr' | 'tech' | 'office' | 'general';
  title: string;
  description: string;
  submittedBy?: string;
  submittedDate: Date;
  status: 'new' | 'under-review' | 'implemented' | 'rejected';
  upvotes: number;
  isAnonymous: boolean;
}

const mockSurveys: Survey[] = [
  {
    id: 'SUR001',
    title: 'Q4 2024 Employee Satisfaction',
    description: 'Quarterly pulse check on employee satisfaction and engagement',
    type: 'anonymous',
    status: 'active',
    createdBy: 'Alexandra HR',
    createdDate: new Date('2024-12-01'),
    responses: 23,
    questions: [
      {
        id: 'Q1',
        type: 'rating',
        question: 'How satisfied are you with your current role?',
        required: true
      },
      {
        id: 'Q2',
        type: 'multiple-choice',
        question: 'What aspect of work-life balance is most important to you?',
        options: ['Flexible hours', 'Remote work', 'PTO policy', 'Workload management'],
        required: true
      },
      {
        id: 'Q3',
        type: 'text',
        question: 'What would you change about our current processes?',
        required: false
      }
    ]
  },
  {
    id: 'SUR002',
    title: 'Office Reopening Feedback',
    description: 'Gather feedback on office policies and safety measures',
    type: 'identified',
    status: 'closed',
    createdBy: 'Alexandra HR',
    createdDate: new Date('2024-11-15'),
    responses: 47,
    questions: []
  }
];

const mockSuggestions: Suggestion[] = [
  {
    id: 'SUG001',
    category: 'office',
    title: 'Improve Office Lighting',
    description: 'The lighting in the main work area is too dim. Consider adding more natural light or better LED fixtures.',
    submittedBy: 'Anonymous',
    submittedDate: new Date('2024-12-10'),
    status: 'under-review',
    upvotes: 12,
    isAnonymous: true
  },
  {
    id: 'SUG002',
    category: 'tech',
    title: 'Upgrade Development Tools',
    description: 'Request for licenses for advanced development tools like JetBrains suite for the entire dev team.',
    submittedBy: 'Mike Chen',
    submittedDate: new Date('2024-12-08'),
    status: 'implemented',
    upvotes: 8,
    isAnonymous: false
  },
  {
    id: 'SUG003',
    category: 'hr',
    title: 'Flexible Lunch Hours',
    description: 'Allow more flexibility in lunch break timing to accommodate different schedules and preferences.',
    submittedBy: 'Anonymous',
    submittedDate: new Date('2024-12-05'),
    status: 'new',
    upvotes: 15,
    isAnonymous: true
  }
];

export function FeedbackModule({ userRole }: { userRole: string }) {
  const [surveys, setSurveys] = useState<Survey[]>(mockSurveys);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(mockSuggestions);
  const [showNewSurveyDialog, setShowNewSurveyDialog] = useState(false);
  const [showNewSuggestionDialog, setShowNewSuggestionDialog] = useState(false);

  const [newSurvey, setNewSurvey] = useState({
    title: '',
    description: '',
    type: 'anonymous' as 'anonymous' | 'identified',
    questions: [] as Omit<SurveyQuestion, 'id'>[]
  });

  const [newSuggestion, setNewSuggestion] = useState({
    category: '',
    title: '',
    description: '',
    isAnonymous: true
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    type: 'multiple-choice' as SurveyQuestion['type'],
    question: '',
    options: [''],
    required: true
  });

  const addQuestion = () => {
    if (!currentQuestion.question) return;
    
    const question: Omit<SurveyQuestion, 'id'> = {
      type: currentQuestion.type,
      question: currentQuestion.question,
      options: currentQuestion.type === 'multiple-choice' ? currentQuestion.options.filter(o => o.trim()) : undefined,
      required: currentQuestion.required
    };
    
    setNewSurvey(prev => ({
      ...prev,
      questions: [...prev.questions, question]
    }));
    
    setCurrentQuestion({
      type: 'multiple-choice',
      question: '',
      options: [''],
      required: true
    });
  };

  const addOption = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const updateOption = (index: number, value: string) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const removeOption = (index: number) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleCreateSurvey = () => {
    if (!newSurvey.title || newSurvey.questions.length === 0) return;

    const survey: Survey = {
      id: `SUR${String(surveys.length + 1).padStart(3, '0')}`,
      title: newSurvey.title,
      description: newSurvey.description,
      type: newSurvey.type,
      status: 'draft',
      createdBy: userRole === 'hr' ? 'Alexandra HR' : 'Current User',
      createdDate: new Date(),
      responses: 0,
      questions: newSurvey.questions.map((q, index) => ({
        ...q,
        id: `Q${index + 1}`
      }))
    };

    setSurveys(prev => [survey, ...prev]);
    setShowNewSurveyDialog(false);
    setNewSurvey({
      title: '',
      description: '',
      type: 'anonymous',
      questions: []
    });
  };

  const handleSubmitSuggestion = () => {
    if (!newSuggestion.category || !newSuggestion.title) return;

    const suggestion: Suggestion = {
      id: `SUG${String(suggestions.length + 1).padStart(3, '0')}`,
      category: newSuggestion.category as any,
      title: newSuggestion.title,
      description: newSuggestion.description,
      submittedBy: newSuggestion.isAnonymous ? 'Anonymous' : 'Current User',
      submittedDate: new Date(),
      status: 'new',
      upvotes: 0,
      isAnonymous: newSuggestion.isAnonymous
    };

    setSuggestions(prev => [suggestion, ...prev]);
    setShowNewSuggestionDialog(false);
    setNewSuggestion({
      category: '',
      title: '',
      description: '',
      isAnonymous: true
    });
  };

  const updateSurveyStatus = (surveyId: string, status: Survey['status']) => {
    setSurveys(prev => prev.map(survey => 
      survey.id === surveyId ? { ...survey, status } : survey
    ));
  };

  const updateSuggestionStatus = (suggestionId: string, status: Suggestion['status']) => {
    setSuggestions(prev => prev.map(suggestion => 
      suggestion.id === suggestionId ? { ...suggestion, status } : suggestion
    ));
  };

  const upvoteSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.map(suggestion => 
      suggestion.id === suggestionId 
        ? { ...suggestion, upvotes: suggestion.upvotes + 1 }
        : suggestion
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'closed': return 'bg-red-100 text-red-800';
      case 'implemented': return 'bg-green-100 text-green-800';
      case 'under-review': return 'bg-blue-100 text-blue-800';
      case 'new': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hr': return 'bg-purple-100 text-purple-800';
      case 'tech': return 'bg-blue-100 text-blue-800';
      case 'office': return 'bg-green-100 text-green-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Employee Feedback & Surveys</h2>
          <p className="text-gray-600">Collect feedback and measure employee satisfaction</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showNewSuggestionDialog} onOpenChange={setShowNewSuggestionDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Submit Suggestion
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit a Suggestion</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Category</Label>
                  <Select value={newSuggestion.category} onValueChange={(value) => setNewSuggestion(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hr">HR & Policies</SelectItem>
                      <SelectItem value="tech">Technology & Tools</SelectItem>
                      <SelectItem value="office">Office & Environment</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Title</Label>
                  <Input
                    value={newSuggestion.title}
                    onChange={(e) => setNewSuggestion(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief title for your suggestion"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newSuggestion.description}
                    onChange={(e) => setNewSuggestion(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of your suggestion"
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymous"
                    checked={newSuggestion.isAnonymous}
                    onCheckedChange={(checked) => setNewSuggestion(prev => ({ ...prev, isAnonymous: !!checked }))}
                  />
                  <Label htmlFor="anonymous">Submit anonymously</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowNewSuggestionDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitSuggestion}>
                    Submit Suggestion
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {(userRole === 'hr' || userRole === 'manager') && (
            <Dialog open={showNewSurveyDialog} onOpenChange={setShowNewSurveyDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Survey
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Survey</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Survey Title</Label>
                      <Input
                        value={newSurvey.title}
                        onChange={(e) => setNewSurvey(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter survey title"
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select value={newSurvey.type} onValueChange={(value) => setNewSurvey(prev => ({ ...prev, type: value as any }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="anonymous">Anonymous</SelectItem>
                          <SelectItem value="identified">Identified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newSurvey.description}
                      onChange={(e) => setNewSurvey(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Survey description and purpose"
                    />
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">Questions ({newSurvey.questions.length})</h4>
                    
                    {newSurvey.questions.map((question, index) => (
                      <Card key={index} className="mb-3">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{question.question}</p>
                              <Badge variant="outline" className="mt-1">
                                {question.type.replace('-', ' ')}
                              </Badge>
                              {question.required && (
                                <Badge variant="outline" className="ml-2">Required</Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <Card className="border-dashed">
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          <div>
                            <Label>Question Type</Label>
                            <Select value={currentQuestion.type} onValueChange={(value) => setCurrentQuestion(prev => ({ ...prev, type: value as any }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                <SelectItem value="rating">Rating Scale</SelectItem>
                                <SelectItem value="text">Text Response</SelectItem>
                                <SelectItem value="yes-no">Yes/No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Question</Label>
                            <Input
                              value={currentQuestion.question}
                              onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
                              placeholder="Enter your question"
                            />
                          </div>

                          {currentQuestion.type === 'multiple-choice' && (
                            <div>
                              <Label>Options</Label>
                              {currentQuestion.options.map((option, index) => (
                                <div key={index} className="flex items-center space-x-2 mt-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => updateOption(index, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                  />
                                  {currentQuestion.options.length > 1 && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => removeOption(index)}
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </div>
                              ))}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={addOption}
                                className="mt-2"
                              >
                                Add Option
                              </Button>
                            </div>
                          )}

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="required"
                              checked={currentQuestion.required}
                              onCheckedChange={(checked) => setCurrentQuestion(prev => ({ ...prev, required: !!checked }))}
                            />
                            <Label htmlFor="required">Required question</Label>
                          </div>

                          <Button onClick={addQuestion} className="w-full">
                            Add Question
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowNewSurveyDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateSurvey}>
                      Create Survey
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Surveys</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {surveys.filter(s => s.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {surveys.reduce((sum, s) => sum + s.responses, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suggestions</CardTitle>
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suggestions.length}</div>
            <p className="text-xs text-muted-foreground">
              {suggestions.filter(s => s.status === 'new').length} new
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Rate</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">Last 3 surveys</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="surveys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="surveys">Surveys</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestion Box</TabsTrigger>
          <TabsTrigger value="pulse">Pulse Check</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="surveys">
          <Card>
            <CardHeader>
              <CardTitle>Employee Surveys</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {surveys.map((survey) => (
                  <Card key={survey.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{survey.title}</h4>
                          <p className="text-sm text-gray-600">{survey.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>Created {format(survey.createdDate, 'MMM dd, yyyy')}</span>
                            <span>{survey.responses} responses</span>
                            <span>{survey.questions.length} questions</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {survey.type}
                          </Badge>
                          <Badge className={getStatusColor(survey.status)}>
                            {survey.status}
                          </Badge>
                          {(userRole === 'hr' || userRole === 'manager') && survey.status === 'draft' && (
                            <Button
                              size="sm"
                              onClick={() => updateSurveyStatus(survey.id, 'active')}
                            >
                              Launch
                            </Button>
                          )}
                          {survey.status === 'active' && (
                            <Button size="sm" variant="outline">
                              Respond
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions">
          <Card>
            <CardHeader>
              <CardTitle>Suggestion Box</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <Card key={suggestion.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getCategoryColor(suggestion.category)}>
                              {suggestion.category.toUpperCase()}
                            </Badge>
                            <Badge className={getStatusColor(suggestion.status)}>
                              {suggestion.status.replace('-', ' ')}
                            </Badge>
                          </div>
                          <h4 className="font-medium">{suggestion.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>By {suggestion.submittedBy}</span>
                            <span>{format(suggestion.submittedDate, 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => upvoteSuggestion(suggestion.id)}
                            className="flex items-center space-x-1"
                          >
                            <Heart className="w-4 h-4" />
                            <span>{suggestion.upvotes}</span>
                          </Button>
                          {userRole === 'hr' && suggestion.status === 'new' && (
                            <Select onValueChange={(value) => updateSuggestionStatus(suggestion.id, value as any)}>
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Update" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="under-review">Under Review</SelectItem>
                                <SelectItem value="implemented">Implemented</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pulse">
          <Card>
            <CardHeader>
              <CardTitle>Quick Pulse Check</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">How are you feeling today?</h3>
                  <div className="flex justify-center space-x-4">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        variant="outline"
                        size="lg"
                        className="w-16 h-16 rounded-full"
                      >
                        <Star className={`w-6 h-6 ${rating <= 3 ? 'text-yellow-500' : 'text-green-500'}`} />
                      </Button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">1-click anonymous feedback</p>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4">Recent Pulse Results</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">4.2</div>
                      <div className="text-sm text-gray-600">This Week</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">4.1</div>
                      <div className="text-sm text-gray-600">Last Week</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">4.0</div>
                      <div className="text-sm text-gray-600">Average</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Survey Response Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Response rate visualization would go here
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Satisfaction Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Satisfaction trend chart would go here
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
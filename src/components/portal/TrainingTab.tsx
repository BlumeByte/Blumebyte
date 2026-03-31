import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import {
  GraduationCap, Loader2, Search, BookOpen, Clock, Users,
  CheckCircle2, Play, Award, Calendar, ChevronRight, Star, Pencil
} from 'lucide-react';
import { api } from '../../lib/api-client';
import { toast } from 'sonner';
import { brandGradientStyle } from '../../lib/branding-context';

interface TrainingProgram {
  id: string;
  title: string;
  name?: string;
  description?: string;
  category?: string;
  type?: string;
  duration?: string;
  instructor?: string;
  instructorName?: string;
  startDate?: string;
  endDate?: string;
  capacity?: number;
  enrolledCount?: number;
  status?: string;
  mandatory?: boolean;
  skills?: string[];
  level?: string;
}

interface Enrollment {
  id: string;
  trainingId: string;
  trainingTitle: string;
  status: 'enrolled' | 'in-progress' | 'completed' | 'dropped';
  progress?: number;
  enrolledAt: string;
  completedAt?: string;
  certificate?: string;
}

interface TrainingTabProps {
  accessToken: string;
  availableTraining: TrainingProgram[];
  enrollments: Enrollment[];
  onRefresh: () => void;
  primaryColor: string;
}

export function TrainingTab({ accessToken, availableTraining, enrollments, onRefresh, primaryColor }: TrainingTabProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [updatingProgress, setUpdatingProgress] = useState<string | null>(null);
  const [progressInput, setProgressInput] = useState<Record<string, number>>({});

  const categories = [...new Set(availableTraining.map(t => t.category || t.type).filter(Boolean))];
  const enrolledTrainingIds = new Set(enrollments.map(e => e.trainingId));

  const filteredTraining = availableTraining.filter(t => {
    const title = t.title || t.name || '';
    const matchesSearch = !search || title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || (t.category || t.type) === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleEnroll = async (program: TrainingProgram) => {
    setEnrolling(program.id);
    try {
      await api('/employee/training-enroll', {
        method: 'POST',
        body: JSON.stringify({ trainingId: program.id, trainingTitle: program.title || program.name }),
        token: accessToken,
      });
      toast.success(`Successfully enrolled in "${program.title || program.name}"`);
      setSelectedProgram(null);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to enroll in training');
    } finally {
      setEnrolling(null);
    }
  };

  const handleProgressUpdate = async (enrollmentId: string, newProgress: number) => {
    setUpdatingProgress(enrollmentId);
    try {
      await api(`/employee/training-progress/${enrollmentId}`, {
        method: 'PUT',
        body: JSON.stringify({ progress: newProgress }),
        token: accessToken,
      });
      toast.success(newProgress >= 100 ? 'Training marked as completed!' : `Progress updated to ${newProgress}%`);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update progress');
    } finally {
      setUpdatingProgress(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      enrolled: 'bg-blue-50 text-blue-700 border-blue-200',
      'in-progress': 'bg-amber-50 text-amber-700 border-amber-200',
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dropped: 'bg-gray-50 text-gray-500 border-gray-200',
    };
    return <Badge variant="outline" className={`${styles[status] || styles.enrolled} text-[10px]`}>{status}</Badge>;
  };

  const getLevelColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-blue-100 text-blue-700';
      case 'advanced': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const completedCount = enrollments.filter(e => e.status === 'completed').length;
  const inProgressCount = enrollments.filter(e => e.status === 'in-progress' || e.status === 'enrolled').length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{availableTraining.length}</p>
            <p className="text-xs text-gray-500 mt-1">Available Programs</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{inProgressCount}</p>
            <p className="text-xs text-gray-500 mt-1">In Progress</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* My Enrollments */}
      {enrollments.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              My Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {enrollments.map((enrollment) => {
                const currentProg = progressInput[enrollment.id] ?? enrollment.progress ?? 0;
                const isActive = enrollment.status === 'enrolled' || enrollment.status === 'in-progress';
                return (
                  <div key={enrollment.id} className="p-3 rounded-xl border border-gray-100 bg-white hover:border-blue-100 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900">{enrollment.trainingTitle}</p>
                      {getStatusBadge(enrollment.status)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Progress</span>
                        <span>{enrollment.progress ?? 0}%</span>
                      </div>
                      <Progress value={enrollment.progress ?? 0} className="h-1.5" />
                    </div>
                    {isActive && (
                      <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-gray-50">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={currentProg}
                          onChange={(e) => setProgressInput(prev => ({ ...prev, [enrollment.id]: parseInt(e.target.value) }))}
                          className="flex-1 h-1.5 accent-blue-600 cursor-pointer"
                        />
                        <span className="text-xs font-mono text-gray-500 w-8 text-right">{currentProg}%</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2"
                          onClick={() => handleProgressUpdate(enrollment.id, currentProg)}
                          disabled={updatingProgress === enrollment.id || currentProg === (enrollment.progress ?? 0)}
                        >
                          {updatingProgress === enrollment.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pencil className="w-3 h-3 mr-0.5" />}
                          {currentProg >= 100 ? 'Complete' : 'Update'}
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      {enrollment.completedAt && (
                        <span className="text-emerald-500 flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          Completed {new Date(enrollment.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Programs */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-600" />
                Training Catalog
              </CardTitle>
              <CardDescription>Browse and enroll in available training programs</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm w-40" />
              </div>
              {categories.length > 0 && (
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {filteredTraining.map((program) => {
              const isEnrolled = enrolledTrainingIds.has(program.id);
              const title = program.title || program.name || 'Untitled';
              return (
                <div
                  key={program.id}
                  onClick={() => setSelectedProgram(program)}
                  className="p-4 rounded-xl border border-gray-100 bg-white hover:border-purple-200 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors flex-1 mr-2">{title}</h4>
                    {isEnrolled ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] flex-shrink-0">Enrolled</Badge>
                    ) : program.mandatory ? (
                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[10px] flex-shrink-0">Required</Badge>
                    ) : null}
                  </div>
                  {program.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{program.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    {program.level && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getLevelColor(program.level)}`}>{program.level}</span>
                    )}
                    {(program.category || program.type) && (
                      <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">{program.category || program.type}</span>
                    )}
                    {program.duration && (
                      <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {program.duration}</span>
                    )}
                    {program.instructor || program.instructorName ? (
                      <span className="flex items-center gap-0.5"><Users className="w-3 h-3" /> {program.instructor || program.instructorName}</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          {filteredTraining.length === 0 && (
            <div className="text-center py-12">
              <GraduationCap className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-1">
                {search || categoryFilter !== 'all' ? 'No matching programs found' : 'No training programs available'}
              </p>
              <p className="text-xs text-gray-300">Check back later for new programs</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Program Detail Dialog */}
      <Dialog open={!!selectedProgram} onOpenChange={() => setSelectedProgram(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedProgram && (() => {
            const isEnrolled = enrolledTrainingIds.has(selectedProgram.id);
            const title = selectedProgram.title || selectedProgram.name || 'Untitled';
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    {title}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedProgram.category || selectedProgram.type || 'Training Program'}
                    {selectedProgram.level && ` | ${selectedProgram.level}`}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {selectedProgram.description && (
                    <p className="text-sm text-gray-600 leading-relaxed">{selectedProgram.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {selectedProgram.duration && (
                      <div className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded-lg">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{selectedProgram.duration}</span>
                      </div>
                    )}
                    {(selectedProgram.instructor || selectedProgram.instructorName) && (
                      <div className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded-lg">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{selectedProgram.instructor || selectedProgram.instructorName}</span>
                      </div>
                    )}
                    {selectedProgram.startDate && (
                      <div className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded-lg">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">Starts {new Date(selectedProgram.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}
                    {selectedProgram.capacity && (
                      <div className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded-lg">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{selectedProgram.enrolledCount || 0}/{selectedProgram.capacity} enrolled</span>
                      </div>
                    )}
                  </div>
                  {selectedProgram.skills && selectedProgram.skills.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Skills you'll gain:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProgram.skills.map((skill, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] bg-purple-50 text-purple-600 border-purple-200">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedProgram(null)}>Close</Button>
                  {isEnrolled ? (
                    <Button disabled className="bg-emerald-600">
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Already Enrolled
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleEnroll(selectedProgram)}
                      disabled={enrolling === selectedProgram.id}
                    >
                      {enrolling === selectedProgram.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Play className="w-4 h-4 mr-1" />
                      )}
                      Enroll Now
                    </Button>
                  )}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
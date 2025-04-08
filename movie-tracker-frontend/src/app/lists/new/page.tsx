'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ListType, ListPrivacy } from '@/types/graphql/lists';
import { useLists } from '@/lib/lists/ListsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BulkMovieAdder } from '@/components/lists/BulkMovieAdder';
import { CheckIcon, ChevronRightIcon, ArrowLeftIcon, ImageIcon, InfoIcon } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Type definitions
interface ListFormData {
  name: string;
  description: string;
  type: ListType;
  privacy: ListPrivacy;
  showComments: boolean;
  sortBy: string;
  maxEntries?: number;
  category?: string;
}

// Define steps
const STEPS = [
  { id: 'details', label: 'List Details' },
  { id: 'movies', label: 'Add Movies' },
  { id: 'image', label: 'Choose Image' }
];

export default function NewListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { createList } = useLists();
  
  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newListId, setNewListId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ListFormData>({
    name: '',
    description: '',
    type: ListType.CUSTOM,
    privacy: ListPrivacy.PRIVATE,
    showComments: true,
    sortBy: 'original',
    maxEntries: undefined,
    category: undefined
  });
  
  // Handle form field changes
  const handleChange = (field: keyof ListFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Navigate to the next step
  const handleNextStep = async () => {
    // If we're on the first step and need to create the list
    if (currentStep === 0 && !newListId) {
      await createNewList();
      return;
    }
    
    // Otherwise, just proceed to the next step
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  // Navigate to the previous step
  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  // Create the list
  const createNewList = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!formData.name.trim()) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "List name is required"
        });
        return;
      }
      
      // Prepare list data, ensuring proper enum handling
      const listInput = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        type: formData.type,
        privacy: formData.privacy,
        category: formData.category?.trim() || undefined,
        maxEntries: formData.maxEntries || undefined
      };
      
      console.log('Creating list with data:', listInput);
      
      const createdList = await createList(listInput);
      
      console.log('List created successfully:', createdList);
      
      // Save the list ID for the next steps
      setNewListId(createdList.id);
      
      // Show success toast
      toast({
        title: "List Created",
        description: "Your list has been created successfully",
      });
      
      // Advance to the next step
      setCurrentStep(prev => prev + 1);
    } catch (error) {
      console.error('Error creating list:', error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error 
          ? `Failed to create list: ${error.message}` 
          : "Failed to create list. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Finish the process
  const handleFinish = () => {
    // Navigate to the list detail page
    if (newListId) {
      router.push(`/lists/${newListId}`);
    } else {
      // If somehow we don't have a list ID, go back to lists page
      router.push('/lists');
    }
  };
  
  // Validate the current step
  const validateCurrentStep = () => {
    if (currentStep === 0) {
      return !!formData.name.trim(); // Name is required
    }
    return true;
  };
  
  // Determine if the next button should be disabled
  const isNextDisabled = () => {
    return !validateCurrentStep() || isSubmitting;
  };
  
  // Get the current step content
  const getStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">List Name</Label>
              <Input
                id="name"
                placeholder="Enter a name for your list"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter a description (optional)"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="privacy">Privacy</Label>
              <Select
                value={formData.privacy}
                onValueChange={(value) => handleChange('privacy', value)}
              >
                <SelectTrigger id="privacy">
                  <SelectValue placeholder="Select privacy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ListPrivacy.PRIVATE}>Private (Only you and collaborators)</SelectItem>
                  <SelectItem value={ListPrivacy.PUBLIC}>Public (Everyone)</SelectItem>
                  <SelectItem value={ListPrivacy.FOLLOWING}>Followers Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">List Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange('type', value)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select list type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ListType.CUSTOM}>Custom List</SelectItem>
                  <SelectItem value={ListType.STANDARD}>Standard List</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Standard lists can have unlimited entries. Custom lists can have a limited number of entries.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <Input
                id="category"
                placeholder="E.g., Action, Favorites, Must-Watch"
                value={formData.category || ''}
                onChange={(e) => handleChange('category', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="showComments">Allow Comments</Label>
              <Select
                value={formData.showComments ? 'yes' : 'no'}
                onValueChange={(value) => handleChange('showComments', value === 'yes')}
              >
                <SelectTrigger id="showComments">
                  <SelectValue placeholder="Allow comments?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sortBy">Default Sort Order</Label>
              <Select
                value={formData.sortBy}
                onValueChange={(value) => handleChange('sortBy', value)}
              >
                <SelectTrigger id="sortBy">
                  <SelectValue placeholder="Select sort order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">Original Order</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="year">Release Year</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.type === ListType.CUSTOM && (
              <div className="space-y-2">
                <Label htmlFor="maxEntries">Maximum Entries</Label>
                <Input
                  id="maxEntries"
                  type="number"
                  placeholder="Leave empty for no limit"
                  value={formData.maxEntries || ''}
                  onChange={(e) => handleChange('maxEntries', e.target.value ? parseInt(e.target.value) : undefined)}
                  min={1}
                />
                <p className="text-xs text-muted-foreground">
                  Custom lists can have a maximum number of entries. Leave empty for no limit.
                </p>
              </div>
            )}
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 text-muted-foreground mb-4">
              <InfoIcon className="h-4 w-4" />
              <p className="text-sm">Search for movies to add to your list</p>
            </div>
            
            {newListId ? (
              <BulkMovieAdder 
                listId={newListId} 
                onSuccess={() => {
                  toast({
                    title: "Movies Added",
                    description: "Movies have been added to your list"
                  });
                }}
              />
            ) : (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 text-muted-foreground mb-4">
              <InfoIcon className="h-4 w-4" />
              <p className="text-sm">Choose a thumbnail image for your list (coming soon)</p>
            </div>
            
            <div className="border border-dashed rounded-lg p-12 flex flex-col items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                This feature is coming soon. You'll be able to upload a custom thumbnail for your list.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/lists')}
            className="mr-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Lists
          </Button>
          <h1 className="text-2xl font-bold">Create New List</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Steps sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {STEPS.map((step, index) => (
                    <div 
                      key={step.id}
                      className={`flex items-center p-2 rounded-md ${
                        currentStep === index 
                          ? 'bg-primary text-primary-foreground' 
                          : currentStep > index 
                            ? 'text-primary' 
                            : 'text-muted-foreground'
                      }`}
                    >
                      <div className={`
                        flex items-center justify-center h-6 w-6 rounded-full mr-2
                        ${currentStep === index 
                          ? 'bg-primary-foreground text-primary' 
                          : currentStep > index 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                        }
                      `}>
                        {currentStep > index ? (
                          <CheckIcon className="h-4 w-4" />
                        ) : (
                          <span className="text-xs">{index + 1}</span>
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main content */}
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">
                  {STEPS[currentStep].label}
                </h2>
              </CardHeader>
              <CardContent>
                {getStepContent()}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handlePreviousStep}
                  disabled={currentStep === 0}
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back
                </Button>
                
                {currentStep === STEPS.length - 1 ? (
                  <Button onClick={handleFinish}>
                    Finish
                  </Button>
                ) : (
                  <Button 
                    onClick={handleNextStep}
                    disabled={isNextDisabled()}
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        {currentStep === 0 && !newListId ? 'Create & Continue' : 'Next'}
                        <ChevronRightIcon className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
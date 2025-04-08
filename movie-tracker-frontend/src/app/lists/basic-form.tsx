'use client';

import { ListType, ListPrivacy } from '@/types/graphql/lists';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { CREATE_LIST_DIRECT } from './custom-list-mutation';
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

export default function BasicListForm() {
  const router = useRouter();
  const { toast } = useToast();
  
  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: ListType.CUSTOM,
    privacy: ListPrivacy.PRIVATE,
  });
  
  // Mutation
  const [createList] = useMutation(CREATE_LIST_DIRECT);
  
  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "List name is required"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Submitting list with data:', formData);
      
      // Create the list
      const { data } = await createList({
        variables: {
          name: formData.name,
          description: formData.description || undefined,
          type: formData.type,
          privacy: formData.privacy,
          category: undefined,
          maxEntries: undefined
        }
      });
      
      console.log('List created successfully:', data);
      
      toast({
        title: "Success",
        description: "List created successfully",
      });
      
      // Redirect to the list detail page
      if (data?.createList?.id) {
        router.push(`/lists/${data.createList.id}`);
      } else {
        router.push('/lists');
      }
    } catch (error) {
      console.error('Error creating list:', error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create list. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Create Basic List</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create List'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push('/lists')}>
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Clock,
  CheckCircle,
  Heart,
  ListTodo,
  ShieldCheck,
  Globe,
  Users
} from 'lucide-react';
import { useLists } from '@/lib/lists/ListsContext';
import { useToast } from '@/hooks/use-toast';
import { 
  LIST_CATEGORIES, 
  ListCategory, 
  useListCategories 
} from '@/hooks/use-list-categories';
import { ListType, ListPrivacy } from '@/types/graphql/lists';

const createListSchema = z.object({
  name: z.string().min(1, 'List name is required').max(50, 'List name must be 50 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  privacy: z.enum(['PUBLIC', 'PRIVATE', 'FOLLOWING']),
  type: z.enum(['STANDARD', 'CUSTOM']),
  category: z.string(),
  maxEntries: z.number().int().positive().optional()
});

type CreateListFormValues = z.infer<typeof createListSchema>;

interface CreateListFormProps {
  onSuccess?: (listId: string) => void;
  onCancel?: () => void;
  defaultValues?: Partial<CreateListFormValues>;
  includeCard?: boolean;
}

export function CreateListForm({
  onSuccess,
  onCancel,
  defaultValues = {
    type: 'CUSTOM',
    privacy: 'PRIVATE',
    category: LIST_CATEGORIES.CUSTOM
  },
  includeCard = true
}: CreateListFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { createList } = useLists();
  const { categoryOptions } = useListCategories();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<CreateListFormValues>({
    resolver: zodResolver(createListSchema),
    defaultValues
  });

  const onSubmit = async (data: CreateListFormValues) => {
    setIsSubmitting(true);
    
    try {
      const newList = await createList(data);
      
      toast({
        title: 'Success',
        description: 'List created successfully!'
      });
      
      if (onSuccess) {
        onSuccess(newList.id);
      } else {
        router.push(`/lists/${newList.id}`);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create list'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>List Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter list name" {...field} />
              </FormControl>
              <FormDescription>
                Choose a descriptive name for your list
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add a description for your list"
                  className="resize-none"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Briefly describe what this list is about
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>List Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={LIST_CATEGORIES.TO_WATCH_MOVIES}>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-blue-500" />
                        <span>Movies To Watch</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={LIST_CATEGORIES.WATCHED_MOVIES}>
                      <div className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        <span>Watched Movies</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={LIST_CATEGORIES.FAVORITES}>
                      <div className="flex items-center">
                        <Heart className="mr-2 h-4 w-4 text-pink-500" />
                        <span>Favorite Movies</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={LIST_CATEGORIES.CUSTOM}>
                      <div className="flex items-center">
                        <ListTodo className="mr-2 h-4 w-4 text-gray-500" />
                        <span>Custom List</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Categorize your list for better organization
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="privacy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Privacy</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select privacy level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PRIVATE">
                      <div className="flex items-center">
                        <ShieldCheck className="mr-2 h-4 w-4 text-slate-500" />
                        <span>Private</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="PUBLIC">
                      <div className="flex items-center">
                        <Globe className="mr-2 h-4 w-4 text-slate-500" />
                        <span>Public</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="FOLLOWING">
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4 text-slate-500" />
                        <span>Followers Only</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Control who can see your list
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create List'}
          </Button>
        </div>
      </form>
    </Form>
  );
  
  if (includeCard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create New List</CardTitle>
          <CardDescription>
            Create a new list to organize your favorite movies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formContent}
        </CardContent>
      </Card>
    );
  }
  
  return formContent;
}
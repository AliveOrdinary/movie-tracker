'use client';

import { ListType, ListPrivacy } from '@/types/graphql/lists';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

export default function ListFix() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [listName, setListName] = useState('');
  
  const handleCreateList = async () => {
    if (!listName) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a list name"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Construct the direct mutation without using enum values
      const mutation = `
        mutation {
          createList(input: {
            name: "${listName}"
            type: "CUSTOM"
            privacy: "PRIVATE"
          }) {
            id
            name
            type
            privacy
          }
        }
      `;
      
      // Direct fetch to backend
      const response = await fetch('http://localhost:3001/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('auth_token') || '',
        },
        body: JSON.stringify({
          query: mutation
        }),
        credentials: 'include',
      });
      
      const result = await response.json();
      
      if (result.errors) {
        console.error("GraphQL errors:", result.errors);
        throw new Error(result.errors[0]?.message || "Failed to create list");
      }
      
      if (!result.data?.createList) {
        throw new Error("No data returned from server");
      }
      
      const listId = result.data.createList.id;
      
      toast({
        title: "Success",
        description: "List created successfully!"
      });
      
      // Navigate to the newly created list
      router.push(`/lists/${listId}`);
    } catch (error) {
      console.error("Error creating list:", error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create list"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Quick List Creation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="listName">List Name</Label>
              <Input
                id="listName"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="Enter list name"
              />
            </div>
            
            <Button 
              onClick={handleCreateList} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create List'}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" onClick={() => router.push('/lists')}>
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
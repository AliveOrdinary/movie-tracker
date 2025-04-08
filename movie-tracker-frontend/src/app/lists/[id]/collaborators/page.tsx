'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_LIST_BY_ID,
  ADD_COLLABORATOR,
  REMOVE_COLLABORATOR,
  UPDATE_COLLABORATOR,
  CollaboratorPermission,
  ListCollaborator
} from '@/types/graphql/lists';
import { useAuth } from '@/lib/auth/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, UserPlus, Trash, Check, X, Shield, Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SEARCH_USERS } from '@/types/graphql/users';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  email: string;
}

export default function CollaboratorsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Record<CollaboratorPermission, boolean>>({
    [CollaboratorPermission.VIEW]: true,
    [CollaboratorPermission.ADD_ITEMS]: false,
    [CollaboratorPermission.REMOVE_ITEMS]: false,
    [CollaboratorPermission.EDIT_DETAILS]: false,
    [CollaboratorPermission.INVITE_OTHERS]: false
  });
  
  // Query for list data
  const { data, loading, error, refetch } = useQuery(GET_LIST_BY_ID, {
    variables: { id },
    fetchPolicy: 'network-only',
  });
  
  // Query for user search
  const { data: usersData, loading: usersLoading } = useQuery(SEARCH_USERS, {
    variables: { query: searchQuery, limit: 5, page: 1 },
    skip: !searchQuery || searchQuery.length < 2
  });
  
  // Mutations
  const [addCollaborator] = useMutation(ADD_COLLABORATOR);
  const [removeCollaborator] = useMutation(REMOVE_COLLABORATOR);
  const [updateCollaborator] = useMutation(UPDATE_COLLABORATOR);
  
  // Update search results when data changes
  useEffect(() => {
    if (usersData?.searchUsers?.users) {
      setSearchResults(usersData.searchUsers.users);
    }
  }, [usersData]);
  
  // Handle user search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };
  
  // Reset form
  const resetForm = () => {
    setSelectedUser(null);
    setSearchQuery('');
    setSearchResults([]);
    setPermissions({
      [CollaboratorPermission.VIEW]: true,
      [CollaboratorPermission.ADD_ITEMS]: false,
      [CollaboratorPermission.REMOVE_ITEMS]: false,
      [CollaboratorPermission.EDIT_DETAILS]: false,
      [CollaboratorPermission.INVITE_OTHERS]: false
    });
  };
  
  // Handle adding a collaborator
  const handleAddCollaborator = async () => {
    if (!selectedUser) {
      toast({
        variant: 'default',
        title: 'No user selected',
        description: 'Please select a user to add as a collaborator'
      });
      return;
    }
    
    // Convert permissions object to array of enabled permissions
    const permissionsArray = Object.entries(permissions)
      .filter(([_, enabled]) => enabled)
      .map(([permission]) => permission as CollaboratorPermission);
    
    try {
      await addCollaborator({
        variables: {
          input: {
            listId: id,
            userId: selectedUser.id,
            permissions: permissionsArray
          }
        }
      });
      
      toast({
        title: 'Success',
        description: `Added ${selectedUser.username} as a collaborator`
      });
      
      resetForm();
      setShowAddDialog(false);
      refetch();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add collaborator'
      });
    }
  };
  
  // Handle removing a collaborator
  const handleRemoveCollaborator = async (collaboratorId: string, username: string) => {
    try {
      await removeCollaborator({
        variables: {
          listId: id,
          collaboratorId
        }
      });
      
      toast({
        title: 'Success',
        description: `Removed ${username} from collaborators`
      });
      
      refetch();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove collaborator'
      });
    }
  };
  
  // Handle updating collaborator permissions
  const handleUpdatePermissions = async (collaboratorId: string, currentPermissions: CollaboratorPermission[], username: string) => {
    try {
      await updateCollaborator({
        variables: {
          listId: id,
          collaboratorId,
          permissions: currentPermissions
        }
      });
      
      toast({
        title: 'Success',
        description: `Updated permissions for ${username}`
      });
      
      refetch();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update permissions'
      });
    }
  };
  
  // Permission descriptions for tooltips
  const permissionDescriptions: Record<CollaboratorPermission, string> = {
    [CollaboratorPermission.VIEW]: 'Can view the list and its contents',
    [CollaboratorPermission.ADD_ITEMS]: 'Can add movies to the list',
    [CollaboratorPermission.REMOVE_ITEMS]: 'Can remove movies from the list',
    [CollaboratorPermission.EDIT_DETAILS]: 'Can edit list details like name and description',
    [CollaboratorPermission.INVITE_OTHERS]: 'Can invite other users to collaborate'
  };
  
  // Format permission name for display
  const formatPermission = (permission: string) => {
    return permission
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (error || !data?.list) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load list data. Please try again.
          </AlertDescription>
        </Alert>
        <div className="text-center mt-6">
          <Button onClick={() => router.push('/lists')}>
            Return to Lists
          </Button>
        </div>
      </div>
    );
  }
  
  const list = data.list;
  const isOwner = user?.id === list.owner.id;
  
  // If not the owner, check if user has invite permission
  const canInvite = isOwner || (list.userPermissions && list.userPermissions.includes(CollaboratorPermission.INVITE_OTHERS));
  
  if (!isOwner && !canInvite) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => router.push(`/lists/${id}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
        </Button>
        
        <Alert variant="default">
          <AlertTitle>No Permission</AlertTitle>
          <AlertDescription>
            You don't have permission to manage collaborators for this list.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <Button 
        variant="ghost" 
        onClick={() => router.push(`/lists/${id}`)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
      </Button>
      
      <h1 className="text-3xl font-bold mb-2">{list.name}</h1>
      <p className="text-muted-foreground mb-6">Manage list collaborators</p>
      
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Collaborators</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Collaborator
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Collaborator</DialogTitle>
              <DialogDescription>
                Search for a user to add as a collaborator
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-search">Search for a user</Label>
                  <Input
                    id="user-search"
                    placeholder="Type username or email"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                
                {usersLoading ? (
                  <div className="py-4 text-center">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((result) => (
                      <div 
                        key={result.id}
                        className={`p-2 rounded border flex items-center ${selectedUser?.id === result.id ? 'border-primary bg-primary/10' : 'hover:bg-muted cursor-pointer'}`}
                        onClick={() => setSelectedUser(result)}
                      >
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarImage src={result.avatarUrl || ''} alt={result.username} />
                          <AvatarFallback>{result.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{result.username}</p>
                          <p className="text-xs text-muted-foreground">{result.email}</p>
                        </div>
                        {selectedUser?.id === result.id && (
                          <Check className="ml-auto text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : searchQuery.length > 1 ? (
                  <p className="text-sm text-muted-foreground">No users found</p>
                ) : null}
                
                {selectedUser && (
                  <div className="space-y-3 mt-4 border-t pt-4">
                    <h3 className="font-medium">Permissions for {selectedUser.username}</h3>
                    <div className="space-y-2">
                      {Object.entries(permissions).map(([permission, enabled]) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`permission-${permission}`}
                            checked={enabled}
                            onCheckedChange={(checked) => {
                              setPermissions(prev => ({
                                ...prev,
                                [permission]: !!checked
                              }));
                            }}
                            disabled={permission === CollaboratorPermission.VIEW}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <Label
                              htmlFor={`permission-${permission}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {formatPermission(permission)}
                            </Label>
                            <p className="text-xs text-muted-foreground">{permissionDescriptions[permission as CollaboratorPermission]}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                resetForm();
                setShowAddDialog(false);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddCollaborator}
                disabled={!selectedUser}
              >
                Add Collaborator
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Current Collaborators</CardTitle>
          <CardDescription>
            Manage who has access to your list and what they can do
          </CardDescription>
        </CardHeader>
        <CardContent>
          {list.collaborators.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <p className="mt-2 text-muted-foreground">No collaborators yet</p>
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="mt-4"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Collaborator
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.collaborators.map((collaborator) => (
                  <TableRow key={collaborator.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={collaborator.user.avatarUrl || ''} alt={collaborator.user.username} />
                          <AvatarFallback>{collaborator.user.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{collaborator.user.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {collaborator.permissions.map((permission) => (
                          <TooltipProvider key={permission}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted">
                                  {formatPermission(permission)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{permissionDescriptions[permission as CollaboratorPermission]}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(collaborator.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Shield className="h-4 w-4" />
                              <span className="sr-only">Edit Permissions</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Permissions</DialogTitle>
                              <DialogDescription>
                                Update permissions for {collaborator.user.username}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <div className="space-y-2">
                                {Object.values(CollaboratorPermission).map((permission) => {
                                  const isChecked = collaborator.permissions.includes(permission);
                                  return (
                                    <div key={permission} className="flex items-center space-x-2">
                                      <Checkbox 
                                        id={`edit-permission-${collaborator.id}-${permission}`}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          const newPermissions = checked
                                            ? [...collaborator.permissions, permission]
                                            : collaborator.permissions.filter(p => p !== permission);
                                          
                                          handleUpdatePermissions(
                                            collaborator.id, 
                                            newPermissions as CollaboratorPermission[],
                                            collaborator.user.username
                                          );
                                        }}
                                        disabled={permission === CollaboratorPermission.VIEW}
                                      />
                                      <div className="grid gap-1.5 leading-none">
                                        <Label
                                          htmlFor={`edit-permission-${collaborator.id}-${permission}`}
                                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                          {formatPermission(permission)}
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                          {permissionDescriptions[permission as CollaboratorPermission]}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => {
                                  toast({
                                    title: 'Permissions Updated',
                                    description: 'Collaborator permissions have been updated'
                                  });
                                }}
                              >
                                Done
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCollaborator(collaborator.id, collaborator.user.username)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
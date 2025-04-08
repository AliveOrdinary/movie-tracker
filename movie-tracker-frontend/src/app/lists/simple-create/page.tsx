'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { CreateListForm } from '@/components/lists/create';

export default function SimpleCreatePage() {
  const router = useRouter();
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            asChild
            className="mb-4"
          >
            <Link href="/lists">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Lists
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Create a List</h1>
          <p className="text-muted-foreground">Create a new list to organize your movies.</p>
        </div>
        
        <CreateListForm
          onCancel={() => router.push('/lists')}
        />
      </div>
    </div>
  );
}
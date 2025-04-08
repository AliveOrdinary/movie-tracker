'use client';

import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BasicListForm from '../basic-form';

export default function QuickListPage() {
  return (
    <div className="container mx-auto py-8 px-4">
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
        <h1 className="text-2xl font-bold">Create Quick List</h1>
        <p className="text-muted-foreground mt-1">
          Create a simple list with minimal configuration
        </p>
      </div>
      
      <BasicListForm />
    </div>
  );
}
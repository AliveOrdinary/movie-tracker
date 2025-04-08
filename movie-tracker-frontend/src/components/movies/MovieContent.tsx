// src/components/movies/MovieContent.tsx
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Film, 
  Info
} from 'lucide-react';

interface MovieContentProps {
  movie: {
    id: string;
    tmdbId: number;
    overview: string;
    languages: string[];
    isAdult: boolean;
  };
}

export function MovieContent({ movie }: MovieContentProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList>
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <Film className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="details" className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          Details
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Synopsis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{movie.overview}</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="details" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">Languages</h4>
              <p className="text-muted-foreground">
                {movie.languages.join(', ')}
              </p>
            </div>
            {movie.isAdult && (
              <div>
                <h4 className="font-medium">Content Advisory</h4>
                <p className="text-muted-foreground">
                This movie is rated for mature audiences.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
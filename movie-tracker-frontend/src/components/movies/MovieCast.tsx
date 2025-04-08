// src/components/movies/MovieCast.tsx
import { getTMDBImageUrl } from '@/lib/utils/movie-utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

interface MovieCastProps {
  cast: CastMember[];
  crew: CrewMember[];
}

export function MovieCast({ cast, crew }: MovieCastProps) {
  // Group crew members by department
  const crewByDepartment = crew.reduce((acc, member) => {
    if (!acc[member.department]) {
      acc[member.department] = [];
    }
    acc[member.department].push(member);
    return acc;
  }, {} as Record<string, CrewMember[]>);

  return (
    <Tabs defaultValue="cast">
      <TabsList>
        <TabsTrigger value="cast">Cast ({cast.length})</TabsTrigger>
        <TabsTrigger value="crew">Crew ({crew.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="cast" className="mt-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cast.map((member) => (
            <div
              key={`${member.id}-${member.character}`}
              className="flex flex-col items-center text-center p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <Avatar className="h-24 w-24 mb-2">
                {member.profile_path ? (
                  <AvatarImage
                    src={getTMDBImageUrl(member.profile_path, 'profile', 'medium')}
                    alt={member.name}
                  />
                ) : (
                  <AvatarFallback>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="space-y-1">
                <h4 className="font-medium leading-none">{member.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {member.character}
                </p>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="crew" className="mt-4 space-y-6">
        {Object.entries(crewByDepartment).map(([department, members]) => (
          <div key={department}>
            <h3 className="font-semibold text-lg mb-4">{department}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {members.map((member) => (
                <div
                  key={`${member.id}-${member.job}`}
                  className="flex flex-col items-center text-center p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <Avatar className="h-24 w-24 mb-2">
                    {member.profile_path ? (
                      <AvatarImage
                        src={getTMDBImageUrl(member.profile_path, 'profile', 'medium')}
                        alt={member.name}
                      />
                    ) : (
                      <AvatarFallback>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="space-y-1">
                    <h4 className="font-medium leading-none">{member.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {member.job}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
}
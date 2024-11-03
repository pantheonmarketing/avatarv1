import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { AvatarData } from "../types/avatar";

interface AvatarDetails {
  career: string;
  ageRange: string;
  // add other properties as needed
}

interface AvatarTemplatesProps {
  savedAvatars: AvatarData[];
  onLoadAvatar: (avatar: AvatarData, index: number) => void;
}

export function AvatarTemplates({ savedAvatars, onLoadAvatar }: AvatarTemplatesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {savedAvatars.map((avatar, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>{avatar.name || `Avatar ${index + 1}`}</CardTitle>
          </CardHeader>
          <CardContent>
            {typeof avatar.details === 'object' && 'career' in avatar.details ? (
              <p>{avatar.details.career}, {avatar.details.ageRange}</p>
            ) : (
              <p>{String(avatar.details)}</p>
            )}
            <Button onClick={() => onLoadAvatar(avatar, index)} className="mt-2">
              Load Avatar
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

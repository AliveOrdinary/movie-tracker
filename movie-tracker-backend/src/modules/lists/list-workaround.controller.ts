// src/modules/lists/list-workaround.controller.ts
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ListsService } from './lists.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { ListType, ListPrivacy } from '../../common/enums';
import { User } from '../users/entities/user.entity';

@Controller('api/lists-direct')
@UseGuards(AuthGuard)
export class ListWorkaroundController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  async createList(@Body() body: any, @Req() req: any) {
    const { name, description, type, privacy, category, maxEntries } = body;

    // Get user from request
    const user: User = req.user;

    // Map string type and privacy to enum values
    let listType = ListType.CUSTOM;
    if (type === 'standard') {
      listType = ListType.STANDARD;
    }

    let listPrivacy = ListPrivacy.PRIVATE;
    if (privacy === 'public') {
      listPrivacy = ListPrivacy.PUBLIC;
    } else if (privacy === 'following') {
      listPrivacy = ListPrivacy.FOLLOWING;
    }

    // Create the list
    const list = await this.listsService.createList({
      name,
      description,
      type: listType,
      privacy: listPrivacy,
      category,
      maxEntries: maxEntries ? Number(maxEntries) : undefined,
    }, user);

    return list;
  }
}
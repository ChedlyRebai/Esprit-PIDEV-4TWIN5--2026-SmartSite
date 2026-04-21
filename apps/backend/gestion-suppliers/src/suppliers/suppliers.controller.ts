import {
  Controller,
  Post,
  Get,
  Param,
  Put,
  Delete,
  Body,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function createStorage(destination: string) {
  return diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = join(process.cwd(), 'uploads', destination);
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
    },
  });
}

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'contract', maxCount: 1 },
        { name: 'insurance', maxCount: 1 },
      ],
      {
        storage: createStorage('contracts'),
        limits: { fileSize: MAX_FILE_SIZE },
        fileFilter: (req, file, cb) => {
          if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(
              new BadRequestException(
                'Only PDF, JPG, and PNG files are allowed (max 5MB)',
              ),
              false,
            );
          }
        },
      },
    ),
  )
  async create(
    @Body() dto: CreateSupplierDto,
    @UploadedFiles()
    files: {
      contract?: Express.Multer.File[];
      insurance?: Express.Multer.File[];
    },
  ) {
    const contractFile = files?.contract?.[0];
    const insuranceFile = files?.insurance?.[0];

    return this.suppliersService.create(dto, contractFile, insuranceFile);
  }

  @Get()
  findAll() {
    return this.suppliersService.findAll();
  }

  @Get('pending-qhse')
  findPendingQhse() {
    return this.suppliersService.findPendingQhse();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.suppliersService.findById(id);
  }

  @Put(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() body: { qhseUserId: string; notes?: string },
  ) {
    return this.suppliersService.approveByQhse(id, body.qhseUserId, body.notes);
  }

  @Put(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() body: { qhseUserId: string; notes?: string },
  ) {
    return this.suppliersService.rejectByQhse(id, body.qhseUserId, body.notes);
  }

  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'contract', maxCount: 1 },
        { name: 'insurance', maxCount: 1 },
      ],
      {
        storage: createStorage('contracts'),
        limits: { fileSize: MAX_FILE_SIZE },
        fileFilter: (req, file, cb) => {
          if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(
              new BadRequestException(
                'Only PDF, JPG, and PNG files are allowed (max 5MB)',
              ),
              false,
            );
          }
        },
      },
    ),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
    @UploadedFiles()
    files: {
      contract?: Express.Multer.File[];
      insurance?: Express.Multer.File[];
    },
  ) {
    const contractFile = files?.contract?.[0];
    const insuranceFile = files?.insurance?.[0];

    return this.suppliersService.update(id, dto, contractFile, insuranceFile);
  }

  @Put(':id/archive')
  async archive(@Param('id') id: string) {
    return this.suppliersService.archive(id);
  }

  @Put(':id/unarchive')
  async unarchive(@Param('id') id: string) {
    return this.suppliersService.unarchive(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }

  @Delete()
  async clear() {
    await this.suppliersService.clear();
  }

  // ── Rating Endpoints ───────────────────────────────────────────────────────

  @Get(':id/ratings')
  getRatings(@Param('id') id: string) {
    return this.suppliersService.getSupplierRatings(id);
  }

  @Get(':id/rating-criteria')
  getRatingCriteria(@Param('id') id: string, @Body() body: { userRole: string }) {
    return {
      criteria: this.suppliersService.getRatingCriteriaByRole(body.userRole),
    };
  }

  @Post(':id/ratings')
  addRating(
    @Param('id') id: string,
    @Body() body: {
      userId: string;
      userName: string;
      userRole: string;
      ratings: Record<string, number>;
      comment?: string;
    },
  ) {
    return this.suppliersService.addRating(
      id,
      body.userId,
      body.userName,
      body.userRole,
      body.ratings,
      body.comment,
    );
  }
}

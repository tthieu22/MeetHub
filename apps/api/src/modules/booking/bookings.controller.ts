import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    HttpCode,
    HttpStatus,
    Query,
    UseGuards,
    Inject,
} from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { IBookingService } from './interface/booking.service.interface';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BOOKING_SERVICE_TOKEN } from './booking.tokens';
import { AuthGuard } from '@api/auth/auth.guard';
import { RolesGuard } from '@api/auth/roles.guard';
import { Roles } from '@api/auth/roles.decorator';
import { UserRole } from '@api/modules/users/schema/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { BookingsService } from './bookings.service';
import { SearchBookingsDto } from './dto/search-bookings.dto';
import { SearchBookingsDetailedDto } from './dto/search-bookings-detailed.dto';
@Controller('bookings')
export class BookingsController {
    constructor(
        @Inject(BOOKING_SERVICE_TOKEN) private readonly bookingService: IBookingService
    ) { }

    @Post("add-booking")
    @UseGuards(AuthGuard)
    async create(@Body() createBookingDto: CreateBookingDto) {
        const booking = await this.bookingService.create(createBookingDto);
        return {
            success: true,
            data: booking,
        };
    }

    @Get("")
    @UseGuards(AuthGuard)
    async findAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('filter') filter: string = '{}'
    ) {
        const parsedFilter = JSON.parse(filter);
        const result = await this.bookingService.findAll(page, limit, parsedFilter);
        return result;
    }

    @Get(':id')
    @UseGuards(AuthGuard)
    async findOne(@Param('id') id: string) {
        const booking = await this.bookingService.findOne(id);
        return {
            success: true,
            data: booking,
        };
    }

    @Put(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
        const updatedBooking = await this.bookingService.update(id, updateBookingDto);
        return {
            success: true,
            data: updatedBooking,
        };
    }

    @Delete(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        await this.bookingService.remove(id);
        return { success: true };
    }

    @Post(':id/cancel')
    @UseGuards(AuthGuard)
    async cancel(@Param('id') id: string) {
        const booking = await this.bookingService.cancelBooking(id);
        return {
            success: true,
            data: booking,
        };
    }
    @Get('search')
    @UseGuards(AuthGuard)
    async searchBookings(@Query() dto: SearchBookingsDto) {
        const result = await this.bookingService.searchBookings(dto);
        return result;
    }

    @Get('search-detailed')
    @UseGuards(AuthGuard)
    async searchBookingsDetailed(@Query() dto: SearchBookingsDetailedDto) {
        const result = await this.bookingService.searchBookingsDetailed(dto);
        return result;
    }
}
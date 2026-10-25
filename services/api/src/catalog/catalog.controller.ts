import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { CatalogFiltersDto, StoreFiltersDto } from './dto';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('home')
  getHome() {
    return this.catalog.getHome();
  }

  @Get('stores')
  listStores(@Query() filters: StoreFiltersDto) {
    return this.catalog.listStores(filters);
  }

  @Get('stores/filters/options')
  storeFilterOptions() {
    return this.catalog.storeFilterOptions();
  }

  @Get('stores/:id')
  getStore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.catalog.getStore(id);
  }

  @Get('nearby-products')
  nearbyProducts(@Query() q: StoreFiltersDto) {
    return this.catalog.nearbyProducts(q);
  }

  @Get('top-stores')
  topStores() {
    return this.catalog.topStores();
  }

  @Get('products')
  listProducts(@Query() filters: CatalogFiltersDto) {
    return this.catalog.listProducts(filters);
  }

  @Get('products/:id')
  getProduct(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.catalog.getProduct(id);
  }
}

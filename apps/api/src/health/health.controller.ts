import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("health")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOkResponse({ description: "The API process is ready to accept requests." })
  getHealth() {
    return {
      success: true,
      data: {
        service: "SIAKAD API",
        status: "ok",
        timestamp: new Date().toISOString()
      }
    };
  }
}
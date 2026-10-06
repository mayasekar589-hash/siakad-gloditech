import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";

@Injectable()
export class AdmissionsAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (process.env.NODE_ENV === "production") throw new ForbiddenException("Authenticated admission RBAC is required.");
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    if (request.headers["x-backoffice-demo"] !== "true") throw new ForbiddenException("Back Office demo access is required.");
    return true;
  }
}

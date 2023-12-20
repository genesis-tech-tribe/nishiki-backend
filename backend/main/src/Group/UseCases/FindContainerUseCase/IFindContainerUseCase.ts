import { ContainerIdDomainError } from "src/Group/Domain/Entities/Container";
import { UseCaseError } from "src/Shared";

export interface IFindContainerUseCase {
	userId: string;
	containerId: string;
}

export class GroupIsNotExisting extends UseCaseError {}
export class UserIsNotAuthorized extends UseCaseError {}

export type FindContainerUseCaseErrorType =
	| ContainerIdDomainError
	| GroupIsNotExisting
	| UserIsNotAuthorized;
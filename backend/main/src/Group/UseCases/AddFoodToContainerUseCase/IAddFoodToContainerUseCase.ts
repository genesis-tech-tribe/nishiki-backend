import { UseCaseError } from "src/Shared";
import {
	ContainerIdDomainError,
	ContainerDomainError,
} from "src/Group/Domain/Entities/Container";

export interface IAddFoodToContainerUseCase {
	userId: string;
	containerId: string;
	name: string;
	unit?: string;
	quantity?: number;
	expiry?: Date;
	category: string;
}

export class ContainerIsNotExisting extends UseCaseError {}
export class UserIsNotAuthorized extends UseCaseError {}

export type AddFoodToContainerUseCaseErrorType =
	| ContainerIsNotExisting
	| ContainerIdDomainError
	| ContainerDomainError;

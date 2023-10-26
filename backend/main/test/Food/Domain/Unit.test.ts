import { describe, expect, it, test } from "vitest";
import { Unit } from "../../../src/Food/Domain/Unit";
import { UnitDomainError } from "../../../src/Food/Domain/Unit";

describe("Unit Object", () => {
	describe("creating unit", () => {
		it("success", () => {
			const unitName = "kilogram";

			const unit = Unit.create({
				name: unitName,
			});

			expect(unit.ok).toBeTruthy();
			expect(unit.value!.name).toBe(unitName);
		});

		it("unit name too long", () => {
			const unitName = "12345678901"; // 11 character
			const unit = Unit.create({
				name: unitName,
			});

			expect(unit.ok).toBeFalsy();
			expect(unit.error).toBeInstanceOf(UnitDomainError);
		});
	});
});

import { Hono } from "hono";
import { honoNotImplementedAdapter } from "src/Shared/Adapters/HonoAdapter";

/**
 * This is a Container router.
 * @param app
 */
export const containerRouter = (app: Hono) => {
	app.get("/containers", (c) => {
		return honoNotImplementedAdapter(c);
	});

	app.post("/containers", (c) => {
		return honoNotImplementedAdapter(c);
	});

	app.get("/containers/:containerId", (c) => {
		return honoNotImplementedAdapter(c);
	});

	app.get("/containers/:containerId/foods", (c) => {
		return honoNotImplementedAdapter(c);
	});

	app.put("/containers/:containerId/foods/:foodId", (c) => {
		return honoNotImplementedAdapter(c);
	});

	app.delete("/containers/:containerId/foods/:foodId", (c) => {
		return honoNotImplementedAdapter(c);
	});
};

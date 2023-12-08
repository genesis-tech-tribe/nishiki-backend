import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { authRouter, userRouter } from "src/User";
import { containerRouter, groupRouter } from "src/Group";

const app = new Hono();

userRouter(app); // /users
authRouter(app); // /auth
containerRouter(app); // /containers
groupRouter(app); // /groups

export const handler = handle(app);

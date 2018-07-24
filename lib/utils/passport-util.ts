import { NextFunction, Request, Response } from 'express-serve-static-core';
import * as _ from 'lodash';
import { SAFE_METHOD } from '../config/constant';
import User from '../models/user-model';
import { setReqAuthUser } from '../utils/request-util';
import { IJwtPayload } from './../models/user-model';
import { getReqAuthUser } from './request-util';
import { ResponseUtil } from './response-util';

export const getCommonAuthCallback = (
	actionParams: any,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	return (err: any, user: User, info: any) => {
		if (user) {
			setReqAuthUser(req, user);
			return next();
		} else if (getReqAuthUser(req)) {
			return next();
		} else if (err) {
			return next(err);
		}

		if (
			actionParams.passThrough ||
			(actionParams.passThroughSafeMethod && _.includes(SAFE_METHOD, req.method))
		) {
			return next();
		}

		if (info && info.unauthorized) {
			return ResponseUtil.sendForbidden(res);
		}
		// Handle TokenExpiredError
		if (info && info.name === 'TokenExpiredError') {
			return ResponseUtil.sendTokenExpiredError(res);
		}
		return ResponseUtil.sendUnauthorized(res);
	};
};

export const getRefreshTokenCallback = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	return (err: any, user: User, info: any) => {
		if (err) {
			return next(err);
		}
		if (info.jwtPayload) {
			const token = user.generateAuthToken(info.jwtPayload.expiresIn);
			if (!token) {
				// Refresh is expired
				return ResponseUtil.sendRefreshExpiredError(res);
			}
			return res.json({ token });
		}
		// Handle TokenExpiredError
		if (info && info.name === 'TokenExpiredError') {
			return ResponseUtil.sendTokenExpiredError(res);
		}
		return ResponseUtil.sendUnauthorized(res);
	};
};

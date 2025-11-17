import { BaseEntity } from "./base.entity";
export declare class User extends BaseEntity {
    id: string;
    email: string;
    passwordHash: string;
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLabelsToTasks1775206300000 implements MigrationInterface {
    name = 'AddLabelsToTasks1775206300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" ADD "labels" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "labels"`);
    }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Wiping database public schema...');
    await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE;');
    await prisma.$executeRawUnsafe('CREATE SCHEMA public;');
    console.log('✅ Public schema successfully dropped and recreated!');
}
main()
    .catch(console.error)
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=scratch-wipe-db.js.map
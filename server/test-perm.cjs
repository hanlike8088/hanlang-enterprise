var p = new (require("@prisma/client").PrismaClient)();
(async function () {
  var emp = await p.adminEmployee.findFirst({ where: { name: "\u9500\u552e\u6d4b\u8bd5\u5458" }, include: { positions: { include: { position: true } } } });
  console.log("Position name:", emp.positions[0].position.positionName);
  console.log("Position keys:", Object.keys(emp.positions[0].position));
  await p.$disconnect();
})();
var p = new (require("@prisma/client").PrismaClient)();
(async function () {
  var user = await p.user.findFirst({ where: { username: "sales_test" } });
  console.log("user.name:", user.name);
  console.log("user.username:", user.username);
  // The PermissionGuard checks: adminEmployee.findFirst({ where: { name: user.name || user.username } })
  // user.name = "销售测试员", but is this name actually in adminEmployee?
  var emp1 = await p.adminEmployee.findFirst({ where: { name: user.name } });
  console.log("Emp by user.name:", emp1 ? emp1.name + " " + emp1.employeeCode : "NOT_FOUND");
  var emp2 = await p.adminEmployee.findFirst({ where: { name: user.username } });
  console.log("Emp by user.username:", emp2 ? emp2.name : "NOT_FOUND");
  // What about employeeCode?
  var emp3 = await p.adminEmployee.findFirst({ where: { employeeCode: user.username } });
  console.log("Emp by employeeCode=username:", emp3 ? emp3.name : "NOT_FOUND");
  await p.$disconnect();
})();
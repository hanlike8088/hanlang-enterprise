var p = new (require("@prisma/client").PrismaClient)();
(async function () {
  // Simulate exactly what PermissionGuard does
  var emp = await p.adminEmployee.findFirst({
    where: { name: "\u9500\u552e\u6d4b\u8bd5\u5458" },
    include: {
      positions: {
        include: {
          position: {
            include: {
              positionRoles: {
                include: {
                  role: {
                    include: {
                      rolePermissions: {
                        include: { permission: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!emp) { console.log("EMP NOT FOUND"); await p.$disconnect(); return; }
  console.log("Employee found:", emp.name);
  console.log("Positions:", emp.positions.length);
  var userPerms = new Set();
  for (var i=0; i<emp.positions.length; i++) {
    var ep = emp.positions[i];
    console.log(" Position:", ep.position.positionName);
    console.log(" PositionRoles:", ep.position.positionRoles.length);
    for (var j=0; j<ep.position.positionRoles.length; j++) {
      var pr = ep.position.positionRoles[j];
      console.log("  Role:", pr.role.roleName);
      console.log("  RolePermissions:", pr.role.rolePermissions.length);
      for (var k=0; k<pr.role.rolePermissions.length; k++) {
        var rp = pr.role.rolePermissions[k];
        console.log("    PermCode:", rp.permission.permCode);
        userPerms.add(rp.permission.permCode);
      }
    }
  }
  console.log("\nTotal user permissions:", userPerms.size);
  console.log("Has sampling:order:write:", userPerms.has("sampling:order:write"));
  await p.$disconnect();
})();
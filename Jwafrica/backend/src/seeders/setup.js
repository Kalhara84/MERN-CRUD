const { sequelize, Usdmast, Excmast, Exlocmast, Exsmast, Expmast, GGenmast } = require('../models');
const { hashPassword } = require('../utils/password');
const { nowLocal } = require('../utils/time');

async function seedUsers() {
  const rows = [
    {
      usdsno: 1, usdusd: '2000', usdcomsno: 0, usdnam: '2000', usdpwd: hashPassword('2000 rbf'),
      usddepsno: 4, usdlocsno: 1, usdemail: 'rumeshdezoysa@gmail.com',
      usdadmin: 'Y', usdactflg: 'Y',
      usdbrcsalyn: 'Y', usdlacsalyn: 'Y', usdprnsalyn: 'Y', usdeggsalyn: 'Y', usdccnsalyn: 'Y',
      usdpgfsalyn: 'Y', usdcafsalyn: 'Y', usdmaisalyn: 'Y', usdhegsalyn: 'Y', usdhassalyn: 'Y',
      usdsalstkcatsnos: '716,741,742,743,744,745,746,747,748,749,750,756,764,765,794,795,796,797,798,827,828',
      usdstkrolyn: 'Y',
      usducdnew: '2000', usdentddt: '2022-05-13',
      usducdame: '2000', usdameddt: '2026-08-28', usdametime: '09:45:58',
    },
    {
      usdsno: 2, usdusd: 'ADMIN', usdcomsno: 0, usdnam: 'ADMIN', usdpwd: hashPassword('0777289242'),
      usddepsno: 7, usdlocsno: 1, usduno: '100',
      usdadmin: 'Y', usdactflg: 'Y',
      usdpwdddt: '2030-01-01',
      usducdame: '2000', usdameddt: '2025-08-13', usdametime: '15:21:31',
    },
  ];

  for (const r of rows) {
    const found = await Usdmast.findOne({ where: { usdusd: r.usdusd, usdcomsno: r.usdcomsno } });
    if (!found) await Usdmast.create(r);
  }

  // Next auto number must continue after the numbers we inserted by hand
  await sequelize.query(
    "SELECT setval(pg_get_serial_sequence('usdmast', 'usdsno'), COALESCE((SELECT MAX(usdsno) FROM usdmast), 1))"
  );
}

// Dummy data for the Expire Module combo boxes. Replace or delete when real data is available.
async function seedExpireData() {
  const { date } = nowLocal();
  const audit = (p) => ({ [`${p}ucdnew`]: 'ADMIN', [`${p}entddt`]: date, [`${p}enttime`]: '09:00:00' });

  for (const [code, name] of [
    ['MED', 'Medicine'], ['VAC', 'Vaccines'], ['FEED', 'Feed'], ['PKG', 'Packing Material'], ['CHM', 'Chemicals'],
  ]) await Excmast.findOrCreate({ where: { excexc: code }, defaults: { excnam: name, ...audit('exc') } });

  for (const [code, name] of [
    ['MAIN', 'Main Store'], ['FARM1', 'Farm 1 Store'], ['FARM2', 'Farm 2 Store'], ['HATCH', 'Hatchery'], ['COLD', 'Cold Room'],
  ]) await Exlocmast.findOrCreate({ where: { exlocloc: code }, defaults: { exlocnam: name, ...audit('exloc') } });

  for (const [code, name] of [
    ['INSP', 'Inspection'], ['REORD', 'Re-order'], ['DISP', 'Disposal'], ['RETN', 'Return to Supplier'], ['QC', 'Quality Check'],
  ]) await Exsmast.findOrCreate({ where: { exsexs: code }, defaults: { exsnam: name, ...audit('exs') } });

  for (const [code, days] of [
    ['1 WEEK', 7], ['2 WEEKS', 14], ['1 MONTH', 30], ['2 MONTHS', 60], ['3 MONTHS', 90], ['6 MONTHS', 180],
  ]) await Expmast.findOrCreate({ where: { expexp: code }, defaults: { expdays: days, ...audit('exp') } });

  for (const [ctl, sub, des] of [
    ['1100', '001', 'Medicine Stock'], ['1100', '002', 'Vaccine Stock'], ['1200', '001', 'Feed Stock'],
    ['1300', '001', 'Packing Material Stock'], ['5100', '001', 'Expired Stock Write-off'],
    ['5100', '002', 'Damaged Stock Write-off'], ['5200', '001', 'Stock Adjustment'],
  ]) {
    await GGenmast.findOrCreate({
      where: { genctl: ctl, gensub: sub },
      defaults: { gendes: des, gendes1: des.slice(0, 30), genctlsub: ctl + sub, gencde: 'N', ...audit('gen') },
    });
  }
}

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // creates missing tables only (never drops or changes existing ones)
    console.log('Tables ready.');
    await seedUsers();
    await seedExpireData();
    console.log('Default data ready. Login: 2000 / "2000 rbf"  or  ADMIN / "0777289242"');
    process.exit(0);
  } catch (err) {
    console.error('Setup failed:', err.message);
    process.exit(1);
  }
})();

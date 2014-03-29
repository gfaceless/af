var data2 = [
  { name: '宁A-001', orgid: '6401', bh: '6400000001' },
  { name: '宁A-002', orgid: '6401', bh: '6400000002' },
  { name: '宁B-001', orgid: '6402', bh: '6400000003' },
  { name: '宁B-004', orgid: '6402', bh: '6400000004' },
  { name: '宁B-004', orgid: '6402', bh: '6400000004' }
]

var data1 = [

  {"name": "石嘴山市公安局",
    "orgid": "6402"},
  {
    "name": "银川市公安局",
    "orgid": "6401"
  }
]

var output = {
  "name": "宁夏公安厅",
  "orgid": "6400",
  children: []
};

data1.forEach(function (el) {
  output.children.push(el);
  el.children = el.children || [];
  data2.forEach(function (car) {
    if(car.orgid === el.orgid) el.children.push(car);
  });
});

console.log(output);

data.forEach ( function (item, i) {
  // item 就是下面的 arr[i]
})

for(var i=0; i<data.length; i++) {
  // arr[i]就是 上面的item
}
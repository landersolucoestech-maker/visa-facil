export function localDateIso(date:Date=new Date()):string{
  if(Number.isNaN(date.getTime()))throw new Error('Invalid date');
  const year=date.getFullYear();
  const month=String(date.getMonth()+1).padStart(2,'0');
  const day=String(date.getDate()).padStart(2,'0');
  return `${year}-${month}-${day}`;
}

export function localMonthStartIso(date:Date=new Date()):string{
  if(Number.isNaN(date.getTime()))throw new Error('Invalid date');
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-01`;
}

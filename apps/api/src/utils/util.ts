interface Filters {
  [key: string]: any;
}
export function removeVietnameseTones(str: string | undefined | null): string {
  if (!str || typeof str !== 'string') return '';
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ''); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
  str = str.replace(/\u02C6|\u0306|\u031B/g, ''); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
  str = str.replace(/ + /g, ' ');
  str = str.trim();
  return str.toLowerCase();
}
// Không cho phép nhập ký tự đặc biệt: ` ~ ! @ # $ % ^ *.
export function isValidName(name: string): boolean {
  if (name.trim() === '' || name === null || name === undefined) return true;
  const regex = /^[^`~!#$%^*]+$/u;
  return regex.test(name);
}
export function areFiltersValid(filters: Record<string, any>): boolean {
  for (const [key, value] of Object.entries(filters)) {
    if (typeof value === 'string' && !isValidName(value)) {
      return false;
    }
  }
  return true;
}
export function convertFiltersBySchema(filters: Record<string, any>, modelSchema: any): { convertedFilters: Record<string, any>; errors: string[] } {
  const convertedFilters: Record<string, any> = {};
  const errors: string[] = [];

  for (const key in filters) {
    const schemaType = modelSchema.path(key)?.instance;
    const value = filters[key];

    if (!schemaType) {
      errors.push(`Trường '${key}' không tồn tại trong schema.`);
      continue;
    }

    if (schemaType === 'Number') {
      if (!isNaN(value) && value.trim() !== '') {
        convertedFilters[key] = Number(value);
      } else {
        errors.push(`Trường '${key}' yêu cầu kiểu Number, nhưng nhận giá trị không hợp lệ.`);
      }
    } else if (schemaType === 'String') {
      convertedFilters[key] = String(value);
    } else {
      convertedFilters[key] = value;
    }
  }

  return { convertedFilters, errors };
}
export function buildMongoQuery(filters: Filters, and: Record<string, any> = { status: STATUS.ACTIVED }): any {
  const orConditions: any[] = [];
  const andConditions: any[] = [and];

  for (const key in filters) {
    if (!filters[key]) continue;

    if (typeof filters[key] === 'number') {
      orConditions.push({ [key]: filters[key] });
    } else if (typeof filters[key] === 'string' && filters[key].trim() !== '') {
      try {
        const searchValue = filters[key].trim();
        const searchValueNoTone = removeVietnameseTones(searchValue);

        // Tạo biểu thức chính quy có thể tìm kiếm cả có dấu và không dấu
        // Ví dụ: nếu tìm kiếm "tung lam", tạo regex có thể match "tùng lâm"
        const regexPattern = searchValueNoTone
          .split('')
          .map((char) => {
            if (char === 'a') return '[aàáạảãâầấậẩẫăằắặẳẵ]';
            if (char === 'e') return '[eèéẹẻẽêềếệểễ]';
            if (char === 'i') return '[iìíịỉĩ]';
            if (char === 'o') return '[oòóọỏõôồốộổỗơờớợởỡ]';
            if (char === 'u') return '[uùúụủũưừứựửữ]';
            if (char === 'y') return '[yỳýỵỷỹ]';
            if (char === 'd') return '[dđ]';
            return char;
          })
          .join('');

        orConditions.push({ [key]: { $regex: regexPattern, $options: 'i' } });
      } catch (error) {
        console.error(`Lỗi tạo RegExp cho ${key}:`, error);
      }
    } else {
      andConditions.push({ [key]: filters[key] });
    }
  }

  if (orConditions.length > 0) {
    andConditions.push({ $or: orConditions });
  }

  return { $and: andConditions };
}

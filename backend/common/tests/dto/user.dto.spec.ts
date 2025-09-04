import { validate } from 'class-validator';
import { CreateUserDto } from '../../src/dto/user.dto';


describe('CreateUserDto', () => {
  it('should fail validation with empty fields', async () => {
    const dto = new CreateUserDto();
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass validation with correct fields', async () => {
    const dto = new CreateUserDto();
    dto.email = 'alice@example.com';
    dto.password = 'qwe123';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});

import { validate } from 'class-validator';
import { CreateUserInput } from '../../src/dto/user.dto';


describe('CreateUserInput', () => {
  it('should pass validation with correct fields', async () => {
    const dto = Object.assign(new CreateUserInput(), {
      email: 'alice@example.com',
      password: 'qwe123',
      name: 'Alice',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with empty fields', async () => {
    const dto = new CreateUserInput(); // all fields empty

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

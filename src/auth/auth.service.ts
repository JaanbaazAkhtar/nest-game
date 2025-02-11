import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schema/user.schema';
import * as moment from 'moment';

@Injectable()
export class AuthService {
  
  private readonly blacklist: Map<string, Date> = new Map();

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(username: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({ username, password: hashedPassword });
    return user.save();
  }

  async login(username: string, password: string): Promise<{ token: string }> {
    const user = await this.userModel.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const token = this.jwtService.sign({ userId: user._id });
    return { token };
  }

  async logout(token: string): Promise<{ message: string }> {
    const expirationDate = this.jwtService.decode(token)?.['exp'];
    if (expirationDate) {
      this.blacklist.set(token, moment.unix(expirationDate).toDate());
    }
    return { message: 'Logged out successfully' };
  }

  isTokenBlacklisted(token: string): boolean {
    const tokenExpiry = this.blacklist.get(token);
    if (tokenExpiry && tokenExpiry > new Date()) {
      return true;
    }
    this.blacklist.delete(token);
    return false;
  }

  async getAllUsers() {
    return await this.userModel.find().exec();
  }

  async getUserById(id) {
    return await this.userModel.findById(id)
  }
  
}
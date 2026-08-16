import type { NavigatorScreenParams } from '@react-navigation/native';

export type HeroesStackParamList = {
  HeroesList: undefined;
  HeroDetail: { heroId: string };
  HeroForm: { heroId?: string } | undefined;
};

export type MissionsStackParamList = {
  MissionsList: undefined;
  MissionDetail: { missionId: string };
  MissionForm: { missionId?: string } | undefined;
};

export type UsersStackParamList = {
  UsersList: undefined;
  UserForm: { userId?: string } | undefined;
};

export type MainTabParamList = {
  Inicio: undefined;
  Héroes: NavigatorScreenParams<HeroesStackParamList> | undefined;
  Misiones: NavigatorScreenParams<MissionsStackParamList> | undefined;
  Favoritos: undefined;
  Usuarios: NavigatorScreenParams<UsersStackParamList> | undefined;
};

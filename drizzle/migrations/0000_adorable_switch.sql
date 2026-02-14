CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" varchar(50) NOT NULL,
	"actor" varchar(42),
	"details" text,
	"ip" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bets" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"match_id" varchar(50) NOT NULL,
	"selection" varchar(10) NOT NULL,
	"odds" real NOT NULL,
	"stake" integer NOT NULL,
	"potential_return" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"bet_type" varchar(20) DEFAULT 'single' NOT NULL,
	"accumulator_id" varchar(50),
	"tx_hash" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"settled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "coupon_redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"coupon_code" varchar(20) NOT NULL,
	"redeemed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"code" varchar(20) PRIMARY KEY NOT NULL,
	"type" varchar(20) NOT NULL,
	"value" varchar(50) NOT NULL,
	"usage_limit" integer DEFAULT 1 NOT NULL,
	"current_usage" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leagues" (
	"id" varchar(10) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"league_id" varchar(10) NOT NULL,
	"season_id" integer NOT NULL,
	"round" integer NOT NULL,
	"home_team_id" varchar(10) NOT NULL,
	"away_team_id" varchar(10) NOT NULL,
	"home_score" integer,
	"away_score" integer,
	"status" varchar(20) DEFAULT 'SCHEDULED' NOT NULL,
	"start_time" timestamp NOT NULL,
	"live_start_time" timestamp,
	"odds_home" real DEFAULT 2 NOT NULL,
	"odds_draw" real DEFAULT 3 NOT NULL,
	"odds_away" real DEFAULT 2.5 NOT NULL,
	"odds_gg" real DEFAULT 1.8 NOT NULL,
	"odds_nogg" real DEFAULT 1.9 NOT NULL,
	"round_hash" varchar(100),
	"commit_hash" varchar(100),
	"block_hash" varchar(100),
	"events" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"current_round" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" varchar(10) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"league_id" varchar(10) NOT NULL,
	"strength" integer DEFAULT 70 NOT NULL,
	"color" varchar(20) DEFAULT '#000000' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"type" varchar(20) NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'kor' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_quests" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"quest_id" varchar(20) NOT NULL,
	"title" varchar(100) NOT NULL,
	"reward" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"frequency" varchar(20) NOT NULL,
	"target" integer NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'LIVE' NOT NULL,
	"verified_at" timestamp,
	"reset_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"wallet_address" varchar(42) PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"coins" integer DEFAULT 1000 NOT NULL,
	"doodl_balance" integer DEFAULT 1000 NOT NULL,
	"alliance_league_id" varchar(10),
	"alliance_team_id" varchar(10),
	"referral_code" varchar(10),
	"referred_by" varchar(42),
	"referral_count" integer DEFAULT 0 NOT NULL,
	"referral_earnings" integer DEFAULT 0 NOT NULL,
	"game_plays" integer DEFAULT 0 NOT NULL,
	"total_bets" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"biggest_win" integer DEFAULT 0 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"best_odds_won" real DEFAULT 0 NOT NULL,
	"daily_walk_points" integer DEFAULT 0 NOT NULL,
	"last_walk_date" varchar(20),
	"login_streak" integer DEFAULT 0 NOT NULL,
	"last_login_date" varchar(20),
	"last_welcome_gift_date" timestamp,
	"unclaimed_alliance_rewards" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"active_theme" varchar(20) DEFAULT 'default',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_wallet_address_users_wallet_address_fk" FOREIGN KEY ("wallet_address") REFERENCES "public"."users"("wallet_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_wallet_address_users_wallet_address_fk" FOREIGN KEY ("wallet_address") REFERENCES "public"."users"("wallet_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_code_coupons_code_fk" FOREIGN KEY ("coupon_code") REFERENCES "public"."coupons"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_address_users_wallet_address_fk" FOREIGN KEY ("wallet_address") REFERENCES "public"."users"("wallet_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quests" ADD CONSTRAINT "user_quests_wallet_address_users_wallet_address_fk" FOREIGN KEY ("wallet_address") REFERENCES "public"."users"("wallet_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_alliance_league_id_leagues_id_fk" FOREIGN KEY ("alliance_league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_alliance_team_id_teams_id_fk" FOREIGN KEY ("alliance_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor");--> statement-breakpoint
CREATE INDEX "bets_wallet_idx" ON "bets" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "bets_match_idx" ON "bets" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "bets_status_idx" ON "bets" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "redemption_wallet_coupon_idx" ON "coupon_redemptions" USING btree ("wallet_address","coupon_code");--> statement-breakpoint
CREATE INDEX "matches_season_idx" ON "matches" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "matches_league_idx" ON "matches" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "matches_status_idx" ON "matches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "matches_round_idx" ON "matches" USING btree ("round");--> statement-breakpoint
CREATE INDEX "teams_league_idx" ON "teams" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "transactions_wallet_idx" ON "transactions" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "transactions_type_idx" ON "transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "user_quests_wallet_idx" ON "user_quests" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "user_quests_quest_idx" ON "user_quests" USING btree ("quest_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_referral_code_idx" ON "users" USING btree ("referral_code");
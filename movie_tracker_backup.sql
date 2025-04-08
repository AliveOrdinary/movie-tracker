--
-- PostgreSQL database dump
--

-- Dumped from database version 14.15
-- Dumped by pg_dump version 14.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: activity_reactions_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.activity_reactions_type_enum AS ENUM (
    'LIKE',
    'LOVE',
    'LAUGH',
    'SAD',
    'ANGRY',
    'AGREE',
    'DISAGREE'
);


ALTER TYPE public.activity_reactions_type_enum OWNER TO postgres;

--
-- Name: activity_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.activity_type_enum AS ENUM (
    'WATCHED_MOVIE',
    'REVIEWED_MOVIE',
    'CREATED_LIST',
    'UPDATED_LIST',
    'FOLLOWED_USER',
    'LIKED_REVIEW'
);


ALTER TYPE public.activity_type_enum OWNER TO postgres;

--
-- Name: admin_action_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.admin_action_type_enum AS ENUM (
    'USER_CREATED',
    'USER_UPDATED',
    'USER_DELETED',
    'USER_ROLE_CHANGED',
    'USER_MODERATED',
    'CONTENT_MODERATED',
    'REPORT_RESOLVED',
    'SYSTEM_SETTING_CHANGED',
    'BULK_ACTION_PERFORMED'
);


ALTER TYPE public.admin_action_type_enum OWNER TO postgres;

--
-- Name: config_category_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.config_category_enum AS ENUM (
    'GENERAL',
    'CONTENT',
    'USERS',
    'SOCIAL',
    'EMAIL',
    'SECURITY',
    'MODERATION',
    'ANALYTICS',
    'PERFORMANCE'
);


ALTER TYPE public.config_category_enum OWNER TO postgres;

--
-- Name: friend_requests_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.friend_requests_status_enum AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'CANCELED'
);


ALTER TYPE public.friend_requests_status_enum OWNER TO postgres;

--
-- Name: list_collaborators_permissions_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.list_collaborators_permissions_enum AS ENUM (
    'view',
    'add_items',
    'remove_items',
    'edit_details',
    'invite_others'
);


ALTER TYPE public.list_collaborators_permissions_enum OWNER TO postgres;

--
-- Name: lists_privacy_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.lists_privacy_enum AS ENUM (
    'public',
    'private',
    'following'
);


ALTER TYPE public.lists_privacy_enum OWNER TO postgres;

--
-- Name: lists_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.lists_type_enum AS ENUM (
    'standard',
    'custom'
);


ALTER TYPE public.lists_type_enum OWNER TO postgres;

--
-- Name: moderation_logs_action_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.moderation_logs_action_enum AS ENUM (
    'REVIEW_APPROVED',
    'REVIEW_REJECTED',
    'REVIEW_FLAGGED',
    'USER_WARNED',
    'USER_SUSPENDED',
    'USER_BANNED'
);


ALTER TYPE public.moderation_logs_action_enum OWNER TO postgres;

--
-- Name: notification_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_type_enum AS ENUM (
    'FOLLOW',
    'REVIEW_LIKE',
    'REVIEW_COMMENT',
    'LIST_FAVORITE',
    'LIST_COLLABORATION',
    'MOVIE_RELEASE',
    'SYSTEM_MESSAGE'
);


ALTER TYPE public.notification_type_enum OWNER TO postgres;

--
-- Name: reports_resolution_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.reports_resolution_enum AS ENUM (
    'DELETE',
    'WARNING',
    'DISMISS'
);


ALTER TYPE public.reports_resolution_enum OWNER TO postgres;

--
-- Name: reports_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.reports_status_enum AS ENUM (
    'PENDING',
    'RESOLVED',
    'DISMISSED'
);


ALTER TYPE public.reports_status_enum OWNER TO postgres;

--
-- Name: review_reactions_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.review_reactions_type_enum AS ENUM (
    'LIKE',
    'LOVE',
    'FUNNY',
    'INSIGHTFUL',
    'DISAGREE'
);


ALTER TYPE public.review_reactions_type_enum OWNER TO postgres;

--
-- Name: reviews_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.reviews_status_enum AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'FLAGGED'
);


ALTER TYPE public.reviews_status_enum OWNER TO postgres;

--
-- Name: social_group_members_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.social_group_members_role_enum AS ENUM (
    'ADMIN',
    'MODERATOR',
    'MEMBER'
);


ALTER TYPE public.social_group_members_role_enum OWNER TO postgres;

--
-- Name: social_groups_privacy_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.social_groups_privacy_enum AS ENUM (
    'PUBLIC',
    'PRIVATE',
    'INVITATION'
);


ALTER TYPE public.social_groups_privacy_enum OWNER TO postgres;

--
-- Name: users_activityfeedfilter_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.users_activityfeedfilter_enum AS ENUM (
    'all',
    'friends',
    'reviews'
);


ALTER TYPE public.users_activityfeedfilter_enum OWNER TO postgres;

--
-- Name: users_profilevisibility_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.users_profilevisibility_enum AS ENUM (
    'public',
    'private',
    'followers'
);


ALTER TYPE public.users_profilevisibility_enum OWNER TO postgres;

--
-- Name: users_reviewssortorder_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.users_reviewssortorder_enum AS ENUM (
    'latest',
    'rating',
    'likes'
);


ALTER TYPE public.users_reviewssortorder_enum OWNER TO postgres;

--
-- Name: users_roles_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.users_roles_enum AS ENUM (
    'user',
    'admin',
    'moderator'
);


ALTER TYPE public.users_roles_enum OWNER TO postgres;

--
-- Name: users_watchlistdisplaymode_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.users_watchlistdisplaymode_enum AS ENUM (
    'grid',
    'list'
);


ALTER TYPE public.users_watchlistdisplaymode_enum OWNER TO postgres;

--
-- Name: watch_history_watchtype_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.watch_history_watchtype_enum AS ENUM (
    'FIRST_TIME',
    'REWATCH'
);


ALTER TYPE public.watch_history_watchtype_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type public.activity_type_enum NOT NULL,
    movie_id uuid,
    review_id uuid,
    list_id uuid,
    watch_history_id uuid,
    target_user_id uuid,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.activities OWNER TO postgres;

--
-- Name: activity_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_comments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    activity_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    is_edited boolean DEFAULT false NOT NULL,
    like_count integer DEFAULT 0 NOT NULL,
    parent_comment_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.activity_comments OWNER TO postgres;

--
-- Name: activity_reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_reactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    activity_id uuid NOT NULL,
    user_id uuid NOT NULL,
    type public.activity_reactions_type_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.activity_reactions OWNER TO postgres;

--
-- Name: admin_audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    admin_id uuid NOT NULL,
    "actionType" public.admin_action_type_enum NOT NULL,
    action character varying NOT NULL,
    metadata jsonb,
    target_user_id uuid,
    "ipAddress" character varying,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    "entityId" character varying,
    "entityType" character varying,
    details text
);


ALTER TABLE public.admin_audit_logs OWNER TO postgres;

--
-- Name: friend_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.friend_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sender_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    status public.friend_requests_status_enum DEFAULT 'PENDING'::public.friend_requests_status_enum NOT NULL,
    message character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.friend_requests OWNER TO postgres;

--
-- Name: list_collaborators; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.list_collaborators (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    list_id uuid,
    user_id uuid,
    permissions public.list_collaborators_permissions_enum[] DEFAULT '{view}'::public.list_collaborators_permissions_enum[] NOT NULL,
    added_by_id uuid,
    "listId" character varying NOT NULL,
    "userId" character varying NOT NULL,
    "addedById" character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.list_collaborators OWNER TO postgres;

--
-- Name: list_favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.list_favorites (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    list_id uuid,
    user_id uuid,
    "listId" character varying NOT NULL,
    "userId" character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.list_favorites OWNER TO postgres;

--
-- Name: list_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.list_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    list_id uuid,
    added_by_id uuid,
    "order" integer DEFAULT 0 NOT NULL,
    "listId" character varying NOT NULL,
    "movieId" integer NOT NULL,
    "addedById" character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.list_items OWNER TO postgres;

--
-- Name: lists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lists (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    description text,
    thumbnail character varying,
    type public.lists_type_enum DEFAULT 'custom'::public.lists_type_enum NOT NULL,
    privacy public.lists_privacy_enum DEFAULT 'private'::public.lists_privacy_enum NOT NULL,
    category character varying,
    owner_id uuid NOT NULL,
    "maxEntries" integer,
    "favoriteCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.lists OWNER TO postgres;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.migrations_id_seq OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: moderation_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.moderation_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    action public.moderation_logs_action_enum NOT NULL,
    reason text NOT NULL,
    moderator_id uuid,
    target_user_id uuid,
    target_review_id uuid,
    metadata jsonb,
    notes text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "isResolved" boolean DEFAULT false NOT NULL,
    "resolvedAt" timestamp without time zone
);


ALTER TABLE public.moderation_logs OWNER TO postgres;

--
-- Name: movies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movies (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "tmdbId" integer NOT NULL,
    title character varying NOT NULL,
    overview text NOT NULL,
    "posterPath" character varying,
    "backdropPath" character varying,
    "voteAverage" numeric(4,2),
    "voteCount" integer,
    "isPopular" boolean DEFAULT false NOT NULL,
    "originalTitle" character varying NOT NULL,
    "releaseYear" integer NOT NULL,
    runtime integer,
    languages text NOT NULL,
    "isAdult" boolean NOT NULL,
    genres text NOT NULL
);


ALTER TABLE public.movies OWNER TO postgres;

--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_preferences (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    email_notifications boolean DEFAULT true NOT NULL,
    push_notifications boolean DEFAULT true NOT NULL,
    review_notifications boolean DEFAULT true NOT NULL,
    friend_request_notifications boolean DEFAULT true NOT NULL,
    watchlist_notifications boolean DEFAULT true NOT NULL,
    movie_release_notifications boolean DEFAULT true NOT NULL,
    system_notifications boolean DEFAULT true NOT NULL,
    disabled_types text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notification_preferences OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    actor_id uuid,
    type public.notification_type_enum NOT NULL,
    message text NOT NULL,
    review_id uuid,
    list_id uuid,
    movie_id uuid,
    metadata jsonb,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    reason text NOT NULL,
    status public.reports_status_enum DEFAULT 'PENDING'::public.reports_status_enum NOT NULL,
    resolution public.reports_resolution_enum,
    "moderatorNotes" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "resolvedAt" timestamp without time zone,
    review_id uuid,
    reporter_id uuid,
    moderator_id uuid
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- Name: review_reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.review_reactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    type public.review_reactions_type_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    user_id uuid,
    review_id uuid
);


ALTER TABLE public.review_reactions OWNER TO postgres;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    content character varying(300) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    movie_id uuid,
    status public.reviews_status_enum DEFAULT 'PENDING'::public.reviews_status_enum NOT NULL,
    tags text[],
    "moderationReason" text,
    "isFlagged" boolean DEFAULT false NOT NULL,
    "moderatedAt" timestamp without time zone,
    "containsSpoilers" boolean DEFAULT false NOT NULL,
    "helpfulVotes" integer DEFAULT 0 NOT NULL,
    "isEdited" boolean DEFAULT false NOT NULL,
    user_id uuid,
    rating integer NOT NULL,
    reaction_count integer DEFAULT 0 NOT NULL,
    watch_history_id uuid,
    is_flagged boolean DEFAULT false,
    moderation_reason text,
    moderated_at timestamp without time zone
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: social_group_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.social_group_members (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role public.social_group_members_role_enum DEFAULT 'MEMBER'::public.social_group_members_role_enum NOT NULL,
    added_by_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.social_group_members OWNER TO postgres;

--
-- Name: social_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.social_groups (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    description text NOT NULL,
    privacy public.social_groups_privacy_enum DEFAULT 'PRIVATE'::public.social_groups_privacy_enum NOT NULL,
    image_url character varying,
    tags text[] DEFAULT ARRAY[]::text[],
    member_count integer DEFAULT 0 NOT NULL,
    creator_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.social_groups OWNER TO postgres;

--
-- Name: system_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_configs (
    key character varying NOT NULL,
    value text NOT NULL,
    category public.config_category_enum DEFAULT 'GENERAL'::public.config_category_enum NOT NULL,
    description character varying NOT NULL,
    "isEncrypted" boolean DEFAULT false NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL,
    "dataType" character varying,
    "validationPattern" character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_configs OWNER TO postgres;

--
-- Name: user_blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_blocks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    blocker_id uuid NOT NULL,
    blocked_id uuid NOT NULL,
    reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_blocks OWNER TO postgres;

--
-- Name: user_follows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_follows (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_follows OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "firebaseUid" character varying NOT NULL,
    username character varying NOT NULL,
    email character varying NOT NULL,
    roles public.users_roles_enum[] DEFAULT '{user}'::public.users_roles_enum[] NOT NULL,
    "emailVerified" boolean DEFAULT false NOT NULL,
    "avatarUrl" character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "lastLoginAt" timestamp without time zone,
    "profileVisibility" public.users_profilevisibility_enum DEFAULT 'public'::public.users_profilevisibility_enum NOT NULL,
    "showOnlineStatus" boolean DEFAULT false NOT NULL,
    "showActivity" boolean DEFAULT true NOT NULL,
    "allowFriendRequests" boolean DEFAULT true NOT NULL,
    "showWatchlist" boolean DEFAULT true NOT NULL,
    "emailNotifications" boolean DEFAULT true NOT NULL,
    "reviewNotifications" boolean DEFAULT true NOT NULL,
    "friendRequestNotifications" boolean DEFAULT true NOT NULL,
    "watchlistNotifications" boolean DEFAULT true NOT NULL,
    bio text,
    location character varying,
    website character varying,
    "favoriteGenres" text[],
    "socialLinks" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "watchlistDisplayMode" public.users_watchlistdisplaymode_enum DEFAULT 'grid'::public.users_watchlistdisplaymode_enum NOT NULL,
    "activityFeedFilter" public.users_activityfeedfilter_enum DEFAULT 'all'::public.users_activityfeedfilter_enum NOT NULL,
    "reviewsSortOrder" public.users_reviewssortorder_enum DEFAULT 'latest'::public.users_reviewssortorder_enum NOT NULL,
    "isBanned" boolean DEFAULT false NOT NULL,
    "banReason" text,
    "bannedAt" timestamp without time zone,
    "suspendedUntil" timestamp without time zone,
    "suspensionReason" text,
    "warningCount" integer DEFAULT 0 NOT NULL,
    "lastWarningReason" text,
    "lastWarningAt" timestamp without time zone,
    "lastActivityAt" timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: watch_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.watch_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "watchedAt" timestamp with time zone NOT NULL,
    "watchType" public.watch_history_watchtype_enum DEFAULT 'FIRST_TIME'::public.watch_history_watchtype_enum NOT NULL,
    rating double precision,
    notes text,
    "watchDuration" integer,
    "isPrivate" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    user_id uuid,
    movie_id uuid
);


ALTER TABLE public.watch_history OWNER TO postgres;

--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activities (id, user_id, type, movie_id, review_id, list_id, watch_history_id, target_user_id, metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: activity_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_comments (id, activity_id, user_id, content, is_edited, like_count, parent_comment_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: activity_reactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_reactions (id, activity_id, user_id, type, created_at) FROM stdin;
\.


--
-- Data for Name: admin_audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_audit_logs (id, admin_id, "actionType", action, metadata, target_user_id, "ipAddress", "timestamp", "entityId", "entityType", details) FROM stdin;
\.


--
-- Data for Name: friend_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.friend_requests (id, sender_id, recipient_id, status, message, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: list_collaborators; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.list_collaborators (id, list_id, user_id, permissions, added_by_id, "listId", "userId", "addedById", "createdAt") FROM stdin;
\.


--
-- Data for Name: list_favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.list_favorites (id, list_id, user_id, "listId", "userId", "createdAt") FROM stdin;
\.


--
-- Data for Name: list_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.list_items (id, list_id, added_by_id, "order", "listId", "movieId", "addedById", "createdAt") FROM stdin;
\.


--
-- Data for Name: lists; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lists (id, name, description, thumbnail, type, privacy, category, owner_id, "maxEntries", "favoriteCount", "createdAt", "updatedAt", "isFeatured") FROM stdin;
2f1af55c-16ff-4b93-83a1-f7263aab50af	test	test	\N	custom	private	\N	722f462c-3cb0-440e-975f-36caf0d96446	10	0	2025-02-21 06:16:57.743496	2025-02-21 06:16:57.743496	f
32e00be4-7c7f-448b-bff9-6e70bc079d3b	Navaneeth	test	\N	custom	public	\N	722f462c-3cb0-440e-975f-36caf0d96446	10	0	2025-02-21 06:18:06.075714	2025-02-21 06:18:06.075714	f
ac14f23c-8cf2-400c-83af-8e4523dc7c0a	test	test	\N	custom	private	\N	722f462c-3cb0-440e-975f-36caf0d96446	10	0	2025-02-21 18:06:25.769095	2025-02-21 18:06:25.769095	f
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	1707341000000	CreateUsers1707341000000
2	1707341000002	AddProfileSettings1707341000002
3	1707341000003	CreateMovies1707341000003
4	1707341000004	CreateReviews1707341000004
6	1708463781234	CreateUsers1708463781234
7	1708463781235	CreateModerationLogs1708463781235
8	1708463781236	AddModerationFields1708463781236
9	1708463781237	CreateReportsTable1708463781237
10	1707739000000	AddUserModerationFields1707739000000
11	1707739100000	AddMissingUserColumns1707739100000
12	1707868400000	CreateListSystem1707868400000
13	1739514435636	CreateWatchHistory1739514435636
14	1739550628653	EnhanceReviewSystem1739550628653
15	1739916455650	AddReactionCountToReviews1739916455650
16	1708380000000	UpdateMovieColumnNames1708380000000
17	1708380000004	UpdateMovieColumns1708380000004
18	1740006714712	UpdateMovieEntity1740006714712
19	1740118440120	UpdateListOwnerColumn1740118440120
20	1708995000000	AddSocialFeatures1708995000000
21	1625824000000	CreateModerationTables1625824000000
22	1709193600002	SimplifiedMovieTableCleanup1709193600002
23	1740250000000	EnhanceSocialModule1740250000000
34	1740260000000	CreateAdminEnhancements1740260000000
35	1741000000000	CreateNotificationPreferences1741000000000
36	1741200000000	UpdateAdminTables1741200000000
37	1741300000000	AdminModuleEnhancements1741300000000
38	1741500000000	AddFeaturedToLists1741500000000
39	1741600000000	CleanupRedundantMigrations1741600000000
40	1741700000000	ConsolidateMovieColumnsUpdates1741700000000
41	1741800000000	AlignColumnNameCasing1741800000000
\.


--
-- Data for Name: moderation_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.moderation_logs (id, action, reason, moderator_id, target_user_id, target_review_id, metadata, notes, "createdAt", "isResolved", "resolvedAt") FROM stdin;
\.


--
-- Data for Name: movies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.movies (id, "tmdbId", title, overview, "posterPath", "backdropPath", "voteAverage", "voteCount", "isPopular", "originalTitle", "releaseYear", runtime, languages, "isAdult", genres) FROM stdin;
b0eeda72-89f1-4541-8292-cb3a400a9562	822119	Captain America: Brave New World	After meeting with newly elected U.S. President Thaddeus Ross, Sam finds himself in the middle of an international incident. He must discover the reason behind a nefarious global plot before the true mastermind has the entire world seeing red.	/pzIddUEMWhWzfvLI3TwxUG2wGoi.jpg	/ywe9S1cOyIhR5yWzK7511NuQ2YX.jpg	6.21	530	f	Captain America: Brave New World	2025	119	en,ja,es	f	Action,Thriller,Science Fiction
f75e99cc-1582-4c0c-9fdb-3bd2bbcc0958	939243	Sonic the Hedgehog 3	Sonic, Knuckles, and Tails reunite against a powerful new adversary, Shadow, a mysterious villain with powers unlike anything they have faced before. With their abilities outmatched in every way, Team Sonic must seek out an unlikely alliance in hopes of stopping Shadow and protecting the planet.	/d8Ryb8AunYAuycVKDp5HpdWPKgC.jpg	/zOpe0eHsq0A2NvNyBbtT6sj53qV.jpg	7.77	1873	f	Sonic the Hedgehog 3	2024	110	en	f	Action,Science Fiction,Comedy,Family
dd967fe7-b1bc-49bf-87f7-6079d2e1f58b	762509	Mufasa: The Lion King	Mufasa, a cub lost and alone, meets a sympathetic lion named Taka, the heir to a royal bloodline. The chance meeting sets in motion an expansive journey of a group of misfits searching for their destiny.	/9bXHaLlsFYpJUutg4E6WXAjaxDi.jpg	/cVh8Af7a9JMOJl75ML3Dg2QVEuq.jpg	7.46	1182	f	Mufasa: The Lion King	2024	118	en	f	Adventure,Family,Animation
63b2a3e2-a499-4dba-aa4e-edddc119a2f9	1241982	Moana 2	After receiving an unexpected call from her wayfinding ancestors, Moana journeys alongside Maui and a new crew to the far seas of Oceania and into dangerous, long-lost waters for an adventure unlike anything she's ever faced.	/aLVkiINlIeCkcZIzb7XHzPYgO6L.jpg	/zo8CIjJ2nfNOevqNajwMRO6Hwka.jpg	7.20	1599	f	Moana 2	2024	99	en	f	Animation,Adventure,Family,Comedy
66d5c496-e225-491e-82e9-a43054c2bca7	927342	Amaran	A heroic true story of Major Mukund Varadarajan, an Indian Army officer who displayed extraordinary bravery during a counterterrorism mission in Kashmir’s Shopian district. The film captures his courage in protecting his nation and the devotion of his wife Indhu Rebecaa Varghese.	/gnsLzt6RdI4QINtfUAEigwEv6s5.jpg	/xljLe4TiQL1b4sT7956IGgj2vrf.jpg	7.60	131	f	அமரன்	2024	169	ta	f	Action,Drama,Adventure,War
445b2636-8a1d-4eda-b679-88c7a5c70e55	1294203	My Fault: London	18-year-old Noah moves from America to London, with her mother who's recently fallen in love with William, a wealthy British businessman. Noah meets William’s son, bad-boy Nick, and soon discovers there is an attraction between them neither can avoid. As Noah spends the summer adjusting to her new life, her devastating past will catch up with her while falling in love for the first time.	/ttN5D6GKOwKWHmCzDGctAvaNMAi.jpg	/uJK0jjJ8QDOQw5lcNBwu059ht4D.jpg	7.54	182	f	My Fault: London	2025	121	en	f	Romance,Drama
dd2ba428-93ba-4452-a8c9-739d51accc61	752	V for Vendetta	In a world in which Great Britain has become a fascist state, a masked vigilante known only as “V” conducts guerrilla warfare against the oppressive British government. When V rescues a young woman from the secret police, he finds in her an ally with whom he can continue his fight to free the people of Britain.	/khYByQchu7O8yyrT1xcGKOmgdHk.jpg	/sFEYsEfzTx7hhjetlNrme8B5OUo.jpg	7.90	14626	f	V for Vendetta	2006	132	en	f	Action,Thriller,Science Fiction
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_preferences (id, user_id, email_notifications, push_notifications, review_notifications, friend_request_notifications, watchlist_notifications, movie_release_notifications, system_notifications, disabled_types, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, actor_id, type, message, review_id, list_id, movie_id, metadata, "isRead", "createdAt") FROM stdin;
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (id, reason, status, resolution, "moderatorNotes", "createdAt", "updatedAt", "resolvedAt", review_id, reporter_id, moderator_id) FROM stdin;
\.


--
-- Data for Name: review_reactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.review_reactions (id, type, "createdAt", user_id, review_id) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, content, "createdAt", "updatedAt", movie_id, status, tags, "moderationReason", "isFlagged", "moderatedAt", "containsSpoilers", "helpfulVotes", "isEdited", user_id, rating, reaction_count, watch_history_id, is_flagged, moderation_reason, moderated_at) FROM stdin;
\.


--
-- Data for Name: social_group_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.social_group_members (id, group_id, user_id, role, added_by_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: social_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.social_groups (id, name, description, privacy, image_url, tags, member_count, creator_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: system_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_configs (key, value, category, description, "isEncrypted", "isSystem", "dataType", "validationPattern", "createdAt", "updatedAt") FROM stdin;
site.name	Movie Tracker	GENERAL	Application name	f	f	\N	\N	2025-03-01 13:59:50.200633	2025-03-01 13:59:50.200633
site.description	Track and share your movie watching experience	GENERAL	Application description	f	f	\N	\N	2025-03-01 13:59:50.200633	2025-03-01 13:59:50.200633
site.maintenance_mode	false	GENERAL	Enable maintenance mode	f	f	\N	\N	2025-03-01 13:59:50.200633	2025-03-01 13:59:50.200633
content.max_reviews_per_day	10	CONTENT	Maximum reviews a regular user can create per day	f	f	\N	\N	2025-03-01 13:59:50.200633	2025-03-01 13:59:50.200633
content.max_lists_per_user	50	CONTENT	Maximum lists a user can create	f	f	\N	\N	2025-03-01 13:59:50.200633	2025-03-01 13:59:50.200633
content.enable_review_reactions	true	CONTENT	Enable reactions on reviews	f	f	\N	\N	2025-03-01 13:59:50.200633	2025-03-01 13:59:50.200633
moderation.auto_approve_reviews	false	MODERATION	Auto-approve reviews from trusted users	f	f	\N	\N	2025-03-01 13:59:50.200633	2025-03-01 13:59:50.200633
moderation.min_reputation_for_auto_approve	50	MODERATION	Minimum reputation required for auto-approval	f	f	\N	\N	2025-03-01 13:59:50.200633	2025-03-01 13:59:50.200633
performance.cache_ttl	3600	PERFORMANCE	Default cache TTL in seconds	f	f	\N	\N	2025-03-01 13:59:50.200633	2025-03-01 13:59:50.200633
performance.max_items_per_page	100	PERFORMANCE	Maximum items per page in paginated responses	f	f	\N	\N	2025-03-01 13:59:50.200633	2025-03-01 13:59:50.200633
\.


--
-- Data for Name: user_blocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_blocks (id, blocker_id, blocked_id, reason, created_at) FROM stdin;
\.


--
-- Data for Name: user_follows; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_follows (id, follower_id, following_id, "createdAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, "firebaseUid", username, email, roles, "emailVerified", "avatarUrl", "createdAt", "updatedAt", "lastLoginAt", "profileVisibility", "showOnlineStatus", "showActivity", "allowFriendRequests", "showWatchlist", "emailNotifications", "reviewNotifications", "friendRequestNotifications", "watchlistNotifications", bio, location, website, "favoriteGenres", "socialLinks", "watchlistDisplayMode", "activityFeedFilter", "reviewsSortOrder", "isBanned", "banReason", "bannedAt", "suspendedUntil", "suspensionReason", "warningCount", "lastWarningReason", "lastWarningAt", "lastActivityAt") FROM stdin;
a36f9357-337a-41e3-a1f7-003d3679576c	WsEdkqfjRvZuM62wX4OXs1k27u62	user_WsEdkqfjRvZuM62wX4OXs1k27u62	test@test.com	{user}	f	\N	2025-02-13 18:49:09.604876	2025-02-19 06:13:22.619272	\N	public	f	t	t	t	t	t	t	t	\N	\N	\N	\N	{}	grid	all	latest	f	\N	\N	\N	\N	0	\N	\N	2025-02-19 01:13:22.603
722f462c-3cb0-440e-975f-36caf0d96446	2zfzFbTERHR70eIYSgfHVxExTBv2	Navaneeth Krishnan	vrnavaneeth135@gmail.com	{user}	f	\N	2025-02-13 02:41:20.641369	2025-02-23 18:46:02.914322	\N	public	f	t	t	t	t	t	t	t	\N	\N	\N	\N	{}	grid	all	latest	f	\N	\N	\N	\N	0	\N	\N	2025-02-23 13:46:02.905
\.


--
-- Data for Name: watch_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.watch_history (id, "watchedAt", "watchType", rating, notes, "watchDuration", "isPrivate", "createdAt", "updatedAt", user_id, movie_id) FROM stdin;
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 41, true);


--
-- Name: reviews PK_231ae565c273ee700b283f15c1d; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY (id);


--
-- Name: watch_history PK_4a7d6381618ede4bcde39b5a708; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.watch_history
    ADD CONSTRAINT "PK_4a7d6381618ede4bcde39b5a708" PRIMARY KEY (id);


--
-- Name: moderation_logs PK_8a59673495b0630d64f8276fbbe; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moderation_logs
    ADD CONSTRAINT "PK_8a59673495b0630d64f8276fbbe" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: activities PK_activities; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "PK_activities" PRIMARY KEY (id);


--
-- Name: activity_comments PK_activity_comments; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_comments
    ADD CONSTRAINT "PK_activity_comments" PRIMARY KEY (id);


--
-- Name: activity_reactions PK_activity_reactions; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_reactions
    ADD CONSTRAINT "PK_activity_reactions" PRIMARY KEY (id);


--
-- Name: admin_audit_logs PK_admin_audit_logs; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT "PK_admin_audit_logs" PRIMARY KEY (id);


--
-- Name: review_reactions PK_b82cdf2aa25d47c14de0200e86b; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_reactions
    ADD CONSTRAINT "PK_b82cdf2aa25d47c14de0200e86b" PRIMARY KEY (id);


--
-- Name: movies PK_c5b2c134e871bfd1c2fe7cc3705; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT "PK_c5b2c134e871bfd1c2fe7cc3705" PRIMARY KEY (id);


--
-- Name: reports PK_d9013193989303580053c0b5ef6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT "PK_d9013193989303580053c0b5ef6" PRIMARY KEY (id);


--
-- Name: notification_preferences PK_e94e2b543f2f218ee68e4f4fad2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT "PK_e94e2b543f2f218ee68e4f4fad2" PRIMARY KEY (id);


--
-- Name: friend_requests PK_friend_requests; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT "PK_friend_requests" PRIMARY KEY (id);


--
-- Name: notifications PK_notifications; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "PK_notifications" PRIMARY KEY (id);


--
-- Name: social_group_members PK_social_group_members; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_group_members
    ADD CONSTRAINT "PK_social_group_members" PRIMARY KEY (id);


--
-- Name: social_groups PK_social_groups; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_groups
    ADD CONSTRAINT "PK_social_groups" PRIMARY KEY (id);


--
-- Name: system_configs PK_system_configs; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_configs
    ADD CONSTRAINT "PK_system_configs" PRIMARY KEY (key);


--
-- Name: user_blocks PK_user_blocks; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT "PK_user_blocks" PRIMARY KEY (id);


--
-- Name: user_follows PK_user_follows; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT "PK_user_follows" PRIMARY KEY (id);


--
-- Name: list_collaborators UQ_0ea4ade44f698d49ccd98d46b1f; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.list_collaborators
    ADD CONSTRAINT "UQ_0ea4ade44f698d49ccd98d46b1f" UNIQUE ("listId", "userId");


--
-- Name: reviews UQ_3047a8dfe9747484c369f6bf5d0; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "UQ_3047a8dfe9747484c369f6bf5d0" UNIQUE (watch_history_id);


--
-- Name: review_reactions UQ_3828e0e19fe30c61cf92df0c2f7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_reactions
    ADD CONSTRAINT "UQ_3828e0e19fe30c61cf92df0c2f7" UNIQUE (user_id, review_id, type);


--
-- Name: notification_preferences UQ_64c90edc7310c6be7c10c96f675; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT "UQ_64c90edc7310c6be7c10c96f675" UNIQUE (user_id);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: list_items UQ_a14257f9c656c9bfc42e781bda8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.list_items
    ADD CONSTRAINT "UQ_a14257f9c656c9bfc42e781bda8" UNIQUE ("listId", "movieId");


--
-- Name: activity_reactions UQ_activity_reactions_activity_user; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_reactions
    ADD CONSTRAINT "UQ_activity_reactions_activity_user" UNIQUE (activity_id, user_id);


--
-- Name: list_favorites UQ_bfa5c8bcc0b003b0cc2908cce57; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.list_favorites
    ADD CONSTRAINT "UQ_bfa5c8bcc0b003b0cc2908cce57" UNIQUE ("listId", "userId");


--
-- Name: users UQ_e621f267079194e5428e19af2f3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_e621f267079194e5428e19af2f3" UNIQUE ("firebaseUid");


--
-- Name: friend_requests UQ_friend_requests_sender_recipient; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT "UQ_friend_requests_sender_recipient" UNIQUE (sender_id, recipient_id);


--
-- Name: social_group_members UQ_social_group_members_group_user; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_group_members
    ADD CONSTRAINT "UQ_social_group_members_group_user" UNIQUE (group_id, user_id);


--
-- Name: social_groups UQ_social_groups_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_groups
    ADD CONSTRAINT "UQ_social_groups_name" UNIQUE (name);


--
-- Name: system_configs UQ_system_configs_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_configs
    ADD CONSTRAINT "UQ_system_configs_key" UNIQUE (key);


--
-- Name: user_blocks UQ_user_blocks_blocker_blocked; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT "UQ_user_blocks_blocker_blocked" UNIQUE (blocker_id, blocked_id);


--
-- Name: user_follows UQ_user_follows_follower_following; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT "UQ_user_follows_follower_following" UNIQUE (follower_id, following_id);


--
-- Name: list_collaborators pk_list_collaborators; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.list_collaborators
    ADD CONSTRAINT pk_list_collaborators PRIMARY KEY (id);


--
-- Name: list_favorites pk_list_favorites; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.list_favorites
    ADD CONSTRAINT pk_list_favorites PRIMARY KEY (id);


--
-- Name: list_items pk_list_items; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.list_items
    ADD CONSTRAINT pk_list_items PRIMARY KEY (id);


--
-- Name: lists pk_lists; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lists
    ADD CONSTRAINT pk_lists PRIMARY KEY (id);


--
-- Name: IDX_0ea4ade44f698d49ccd98d46b1; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_0ea4ade44f698d49ccd98d46b1" ON public.list_collaborators USING btree ("listId", "userId");


--
-- Name: IDX_activities_user_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_activities_user_created" ON public.activities USING btree (user_id, "createdAt");


--
-- Name: IDX_activity_comments_activity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_activity_comments_activity" ON public.activity_comments USING btree (activity_id);


--
-- Name: IDX_activity_comments_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_activity_comments_parent" ON public.activity_comments USING btree (parent_comment_id);


--
-- Name: IDX_activity_reactions_activity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_activity_reactions_activity" ON public.activity_reactions USING btree (activity_id);


--
-- Name: IDX_activity_reactions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_activity_reactions_user" ON public.activity_reactions USING btree (user_id);


--
-- Name: IDX_admin_audit_logs_action_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_admin_audit_logs_action_created" ON public.admin_audit_logs USING btree ("actionType", "timestamp");


--
-- Name: IDX_admin_audit_logs_admin_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_admin_audit_logs_admin_created" ON public.admin_audit_logs USING btree (admin_id, "timestamp");


--
-- Name: IDX_bec5013f0916fb7b24ccad0350; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_bec5013f0916fb7b24ccad0350" ON public.list_items USING btree ("listId", "createdAt");


--
-- Name: IDX_f853e3be53d97af7ff3b2978c7; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_f853e3be53d97af7ff3b2978c7" ON public.list_favorites USING btree ("userId", "createdAt");


--
-- Name: IDX_friend_requests_sender_recipient_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_friend_requests_sender_recipient_status" ON public.friend_requests USING btree (sender_id, recipient_id, status);


--
-- Name: IDX_notifications_user_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_notifications_user_created" ON public.notifications USING btree (user_id, "createdAt");


--
-- Name: IDX_social_group_members_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_social_group_members_group" ON public.social_group_members USING btree (group_id);


--
-- Name: IDX_social_group_members_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_social_group_members_user" ON public.social_group_members USING btree (user_id);


--
-- Name: IDX_social_groups_creator; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_social_groups_creator" ON public.social_groups USING btree (creator_id);


--
-- Name: IDX_social_groups_privacy; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_social_groups_privacy" ON public.social_groups USING btree (privacy);


--
-- Name: IDX_system_configs_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_system_configs_category" ON public.system_configs USING btree (category);


--
-- Name: IDX_user_blocks_blocked; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_user_blocks_blocked" ON public.user_blocks USING btree (blocked_id);


--
-- Name: IDX_user_blocks_blocker; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_user_blocks_blocker" ON public.user_blocks USING btree (blocker_id);


--
-- Name: IDX_user_follows_follower_following; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_user_follows_follower_following" ON public.user_follows USING btree (follower_id, following_id);


--
-- Name: idx_notification_preferences_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences USING btree (user_id);


--
-- Name: idx_notifications_user_id_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_id_is_read ON public.notifications USING btree (user_id, "isRead");


--
-- Name: reports FK_14aa567cf50dcaa93deba2b0b12; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT "FK_14aa567cf50dcaa93deba2b0b12" FOREIGN KEY (moderator_id) REFERENCES public.users(id);


--
-- Name: moderation_logs FK_1a3c8e38a7eb5a7bbdcd80c391a; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moderation_logs
    ADD CONSTRAINT "FK_1a3c8e38a7eb5a7bbdcd80c391a" FOREIGN KEY (moderator_id) REFERENCES public.users(id);


--
-- Name: reviews FK_3047a8dfe9747484c369f6bf5d0; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "FK_3047a8dfe9747484c369f6bf5d0" FOREIGN KEY (watch_history_id) REFERENCES public.watch_history(id);


--
-- Name: list_favorites FK_39c7a06cfbc1b5e6926563601af; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.list_favorites
    ADD CONSTRAINT "FK_39c7a06cfbc1b5e6926563601af" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reviews FK_563501cf3faa75a1ca40be84f82; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "FK_563501cf3faa75a1ca40be84f82" FOREIGN KEY (movie_id) REFERENCES public.movies(id);


--
-- Name: watch_history FK_5e1169219c2bda5624a4b65742d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.watch_history
    ADD CONSTRAINT "FK_5e1169219c2bda5624a4b65742d" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: reports FK_628fb90b2d3a87f2bb236befa66; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT "FK_628fb90b2d3a87f2bb236befa66" FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- Name: notification_preferences FK_64c90edc7310c6be7c10c96f675; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT "FK_64c90edc7310c6be7c10c96f675" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: list_collaborators FK_6da14a5c3917ba253e1ee9b9388; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.list_collaborators
    ADD CONSTRAINT "FK_6da14a5c3917ba253e1ee9b9388" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: list_items FK_7211225643372f045fb51e79889; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.list_items
    ADD CONSTRAINT "FK_7211225643372f045fb51e79889" FOREIGN KEY (added_by_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reviews FK_728447781a30bc3fcfe5c2f1cdf; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: review_reactions FK_73aef9bcca484a58ced48e6a75d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_reactions
    ADD CONSTRAINT "FK_73aef9bcca484a58ced48e6a75d" FOREIGN KEY (review_id) REFERENCES public.reviews(id);


--
-- Name: list_collaborators FK_797731c3890c0cfa90dd00cd327; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.list_collaborators
    ADD CONSTRAINT "FK_797731c3890c0cfa90dd00cd327" FOREIGN KEY (added_by_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: moderation_logs FK_79dbf91946c0a18c27c1c586539; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moderation_logs
    ADD CONSTRAINT "FK_79dbf91946c0a18c27c1c586539" FOREIGN KEY (target_review_id) REFERENCES public.reviews(id);


--
-- Name: list_items FK_8bf07909d6d9e95e8e637bd5b3e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.list_items
    ADD CONSTRAINT "FK_8bf07909d6d9e95e8e637bd5b3e" FOREIGN KEY (list_id) REFERENCES public.lists(id) ON DELETE CASCADE;


--
-- Name: reports FK_9459b9bf907a3807ef7143d2ead; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT "FK_9459b9bf907a3807ef7143d2ead" FOREIGN KEY (reporter_id) REFERENCES public.users(id);


--
-- Name: activities FK_activities_list; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "FK_activities_list" FOREIGN KEY (list_id) REFERENCES public.lists(id) ON DELETE CASCADE;


--
-- Name: activities FK_activities_movie; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "FK_activities_movie" FOREIGN KEY (movie_id) REFERENCES public.movies(id) ON DELETE SET NULL;


--
-- Name: activities FK_activities_review; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "FK_activities_review" FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- Name: activities FK_activities_target_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "FK_activities_target_user" FOREIGN KEY (target_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: activities FK_activities_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "FK_activities_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: activities FK_activities_watch_history; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "FK_activities_watch_history" FOREIGN KEY (watch_history_id) REFERENCES public.watch_history(id) ON DELETE CASCADE;


--
-- Name: activity_comments FK_activity_comments_activity; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_comments
    ADD CONSTRAINT "FK_activity_comments_activity" FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;


--
-- Name: activity_comments FK_activity_comments_parent; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_comments
    ADD CONSTRAINT "FK_activity_comments_parent" FOREIGN KEY (parent_comment_id) REFERENCES public.activity_comments(id) ON DELETE SET NULL;


--
-- Name: activity_comments FK_activity_comments_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_comments
    ADD CONSTRAINT "FK_activity_comments_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: activity_reactions FK_activity_reactions_activity; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_reactions
    ADD CONSTRAINT "FK_activity_reactions_activity" FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;


--
-- Name: activity_reactions FK_activity_reactions_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_reactions
    ADD CONSTRAINT "FK_activity_reactions_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: admin_audit_logs FK_admin_audit_logs_admin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT "FK_admin_audit_logs_admin" FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: admin_audit_logs FK_admin_audit_logs_target_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT "FK_admin_audit_logs_target_user" FOREIGN KEY (target_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: moderation_logs FK_bbbbad2d0090191ba73683b0b84; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moderation_logs
    ADD CONSTRAINT "FK_bbbbad2d0090191ba73683b0b84" FOREIGN KEY (target_user_id) REFERENCES public.users(id);


--
-- Name: watch_history FK_cff7480bc2d70fc9e78f4ec6204; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.watch_history
    ADD CONSTRAINT "FK_cff7480bc2d70fc9e78f4ec6204" FOREIGN KEY (movie_id) REFERENCES public.movies(id);


--
-- Name: lists FK_eb962e2db9730b4e73dfb580861; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lists
    ADD CONSTRAINT "FK_eb962e2db9730b4e73dfb580861" FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: list_collaborators FK_ec746a98a1b7cf4756bfb9f9999; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.list_collaborators
    ADD CONSTRAINT "FK_ec746a98a1b7cf4756bfb9f9999" FOREIGN KEY (list_id) REFERENCES public.lists(id) ON DELETE CASCADE;


--
-- Name: list_favorites FK_f895478b2d056f58e354501fe40; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.list_favorites
    ADD CONSTRAINT "FK_f895478b2d056f58e354501fe40" FOREIGN KEY (list_id) REFERENCES public.lists(id) ON DELETE CASCADE;


--
-- Name: review_reactions FK_fe875fe823e5a692b530e50ed1e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_reactions
    ADD CONSTRAINT "FK_fe875fe823e5a692b530e50ed1e" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: friend_requests FK_friend_requests_recipient; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT "FK_friend_requests_recipient" FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: friend_requests FK_friend_requests_sender; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT "FK_friend_requests_sender" FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications FK_notifications_actor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_notifications_actor" FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notifications FK_notifications_list; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_notifications_list" FOREIGN KEY (list_id) REFERENCES public.lists(id) ON DELETE CASCADE;


--
-- Name: notifications FK_notifications_movie; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_notifications_movie" FOREIGN KEY (movie_id) REFERENCES public.movies(id) ON DELETE SET NULL;


--
-- Name: notifications FK_notifications_review; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_notifications_review" FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- Name: notifications FK_notifications_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_notifications_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: social_group_members FK_social_group_members_added_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_group_members
    ADD CONSTRAINT "FK_social_group_members_added_by" FOREIGN KEY (added_by_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: social_group_members FK_social_group_members_group; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_group_members
    ADD CONSTRAINT "FK_social_group_members_group" FOREIGN KEY (group_id) REFERENCES public.social_groups(id) ON DELETE CASCADE;


--
-- Name: social_group_members FK_social_group_members_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_group_members
    ADD CONSTRAINT "FK_social_group_members_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: social_groups FK_social_groups_creator; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_groups
    ADD CONSTRAINT "FK_social_groups_creator" FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_blocks FK_user_blocks_blocked; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT "FK_user_blocks_blocked" FOREIGN KEY (blocked_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_blocks FK_user_blocks_blocker; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT "FK_user_blocks_blocker" FOREIGN KEY (blocker_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_follows FK_user_follows_follower; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT "FK_user_follows_follower" FOREIGN KEY (follower_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_follows FK_user_follows_following; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT "FK_user_follows_following" FOREIGN KEY (following_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


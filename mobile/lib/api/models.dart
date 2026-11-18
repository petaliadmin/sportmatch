// Modèles de l'API SportMatch (voir contracts/openapi). Désérialisation manuelle, sans génération de code.

DateTime _date(Object? v) => DateTime.parse(v as String);
DateTime? _dateOrNull(Object? v) => v == null ? null : DateTime.parse(v as String);
double? _doubleOrNull(Object? v) => v == null ? null : (v as num).toDouble();

class Venue {
  Venue({required this.id, required this.name, required this.district, required this.sport,
      required this.pricePerHourFcfa, this.rating, this.distanceKm});

  final String id;
  final String name;
  final String district;
  final String sport;
  final int pricePerHourFcfa;
  final double? rating;
  final double? distanceKm;

  factory Venue.fromJson(Map<String, dynamic> j) => Venue(
        id: j['id'] as String,
        name: j['name'] as String,
        district: j['district'] as String,
        sport: j['sport'] as String,
        pricePerHourFcfa: (j['pricePerHourFcfa'] as num).toInt(),
        rating: _doubleOrNull(j['rating']),
        distanceKm: _doubleOrNull(j['distanceKm']),
      );
}

class SportMatchGame {
  SportMatchGame({required this.id, required this.venueId, required this.venueName, required this.sport,
      required this.startsAt, required this.durationMinutes, required this.maxPlayers, required this.level,
      required this.organizerId, required this.status, required this.participants});

  final String id;
  final String venueId;
  final String venueName;
  final String sport;
  final DateTime startsAt;
  final int durationMinutes;
  final int maxPlayers;
  final String level;
  final String organizerId;
  final String status;
  final int participants;

  bool get isOpen => status == 'OPEN';

  factory SportMatchGame.fromJson(Map<String, dynamic> j) => SportMatchGame(
        id: j['id'] as String,
        venueId: j['venueId'] as String,
        venueName: j['venueName'] as String,
        sport: j['sport'] as String,
        startsAt: _date(j['startsAt']),
        durationMinutes: (j['durationMinutes'] as num).toInt(),
        maxPlayers: (j['maxPlayers'] as num).toInt(),
        level: j['level'] as String,
        organizerId: j['organizerId'] as String,
        status: j['status'] as String,
        participants: (j['participants'] as num).toInt(),
      );
}

class Court {
  Court({required this.id, required this.venueId, required this.name, required this.pricePerHourFcfa});

  final String id;
  final String venueId;
  final String name;
  final int pricePerHourFcfa;

  factory Court.fromJson(Map<String, dynamic> j) => Court(
        id: j['id'] as String,
        venueId: j['venueId'] as String,
        name: j['name'] as String,
        pricePerHourFcfa: (j['pricePerHourFcfa'] as num).toInt(),
      );
}

class Slot {
  Slot({required this.startsAt, required this.available});

  final DateTime startsAt;
  final bool available;

  factory Slot.fromJson(Map<String, dynamic> j) => Slot(startsAt: _date(j['startsAt']), available: j['available'] as bool);
}

class Booking {
  Booking({required this.id, required this.courtName, required this.venueName, required this.startsAt,
      required this.endsAt, required this.priceFcfa, required this.status});

  final String id;
  final String courtName;
  final String venueName;
  final DateTime startsAt;
  final DateTime endsAt;
  final int priceFcfa;
  final String status;

  bool get cancellable => status == 'CONFIRMED' && startsAt.isAfter(DateTime.now());

  factory Booking.fromJson(Map<String, dynamic> j) => Booking(
        id: j['id'] as String,
        courtName: j['courtName'] as String,
        venueName: j['venueName'] as String,
        startsAt: _date(j['startsAt']),
        endsAt: _date(j['endsAt']),
        priceFcfa: (j['priceFcfa'] as num).toInt(),
        status: j['status'] as String,
      );
}

class NotificationItem {
  NotificationItem({required this.id, required this.title, required this.body, required this.createdAt});

  final String id;
  final String title;
  final String body;
  final DateTime createdAt;

  factory NotificationItem.fromJson(Map<String, dynamic> j) => NotificationItem(
        id: j['id'] as String,
        title: j['title'] as String,
        body: j['body'] as String,
        createdAt: _date(j['createdAt']),
      );
}

class Conversation {
  Conversation({required this.id, required this.matchId, required this.members, this.lastMessage, this.lastMessageAt});

  final String id;
  final String matchId;
  final int members;
  final String? lastMessage;
  final DateTime? lastMessageAt;

  factory Conversation.fromJson(Map<String, dynamic> j) => Conversation(
        id: j['id'] as String,
        matchId: j['matchId'] as String,
        members: (j['members'] as num).toInt(),
        lastMessage: j['lastMessage'] as String?,
        lastMessageAt: _dateOrNull(j['lastMessageAt']),
      );
}

class ChatMessage {
  ChatMessage({required this.id, required this.senderId, this.senderName, required this.body, required this.sentAt});

  final String id;
  final String senderId;
  final String? senderName;
  final String body;
  final DateTime sentAt;

  factory ChatMessage.fromJson(Map<String, dynamic> j) => ChatMessage(
        id: j['id'] as String,
        senderId: j['senderId'] as String,
        senderName: j['senderName'] as String?,
        body: j['body'] as String,
        sentAt: _date(j['sentAt']),
      );
}

class TournamentSummary {
  TournamentSummary({required this.id, required this.name, required this.sport, required this.startsOn,
      required this.maxTeams, required this.status, required this.organizerId, required this.teams, this.championName});

  final String id;
  final String name;
  final String sport;
  final DateTime startsOn;
  final int maxTeams;
  final String status;
  final String organizerId;
  final int teams;
  final String? championName;

  factory TournamentSummary.fromJson(Map<String, dynamic> j) => TournamentSummary(
        id: j['id'] as String,
        name: j['name'] as String,
        sport: j['sport'] as String,
        startsOn: _date(j['startsOn']),
        maxTeams: (j['maxTeams'] as num).toInt(),
        status: j['status'] as String,
        organizerId: j['organizerId'] as String,
        teams: (j['teams'] as num).toInt(),
        championName: j['championName'] as String?,
      );
}

class Team {
  Team({required this.id, required this.name, required this.captainId});

  final String id;
  final String name;
  final String captainId;

  factory Team.fromJson(Map<String, dynamic> j) =>
      Team(id: j['id'] as String, name: j['name'] as String, captainId: j['captainId'] as String);
}

class BracketMatch {
  BracketMatch({required this.id, required this.round, required this.position, this.homeTeam, this.awayTeam,
      this.homeTeamId, this.awayTeamId, this.homeScore, this.awayScore, this.winnerTeamId, required this.status,
      required this.bye});

  final String id;
  final int round;
  final int position;
  final String? homeTeam;
  final String? awayTeam;
  final String? homeTeamId;
  final String? awayTeamId;
  final int? homeScore;
  final int? awayScore;
  final String? winnerTeamId;
  final String status;
  final bool bye;

  factory BracketMatch.fromJson(Map<String, dynamic> j) => BracketMatch(
        id: j['id'] as String,
        round: (j['round'] as num).toInt(),
        position: (j['position'] as num).toInt(),
        homeTeam: j['homeTeam'] as String?,
        awayTeam: j['awayTeam'] as String?,
        homeTeamId: j['homeTeamId'] as String?,
        awayTeamId: j['awayTeamId'] as String?,
        homeScore: (j['homeScore'] as num?)?.toInt(),
        awayScore: (j['awayScore'] as num?)?.toInt(),
        winnerTeamId: j['winnerTeamId'] as String?,
        status: j['status'] as String,
        bye: j['bye'] as bool,
      );
}

class TournamentDetail {
  TournamentDetail({required this.tournament, required this.teams, required this.bracket});

  final TournamentSummary tournament;
  final List<Team> teams;
  final List<BracketMatch> bracket;

  factory TournamentDetail.fromJson(Map<String, dynamic> j) => TournamentDetail(
        tournament: TournamentSummary.fromJson(j['tournament'] as Map<String, dynamic>),
        teams: (j['teams'] as List).map((e) => Team.fromJson(e as Map<String, dynamic>)).toList(),
        bracket: (j['bracket'] as List).map((e) => BracketMatch.fromJson(e as Map<String, dynamic>)).toList(),
      );
}

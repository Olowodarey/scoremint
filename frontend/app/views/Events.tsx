"use client";

import {
  useAllEvents,
  getEventMode,
  getDistributionType,
  getTimeRemaining,
} from "../../lib/contracts/useAllEvents";
import { formatUnits } from "viem";

export default function Events() {
  const { events, isLoading, error, refetch } = useAllEvents();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading events</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-medium transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🎯</span>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Active Events
          </h1>
        </div>
        <p className="text-gray-400">
          Browse and join prediction events. Test your football knowledge and
          win prizes!
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="gradient-border p-4 text-center">
          <p className="text-2xl font-bold text-white">{events.length}</p>
          <p className="text-sm text-gray-400">Active Events</p>
        </div>
        <div className="gradient-border p-4 text-center">
          <p className="text-2xl font-bold text-white">
            {events.reduce((acc, e) => acc + Number(e.totalParticipants), 0)}
          </p>
          <p className="text-sm text-gray-400">Total Participants</p>
        </div>
        <div className="gradient-border p-4 text-center">
          <p className="text-2xl font-bold text-white">
            {events.filter((e) => Number(e.prizePool) > 0).length}
          </p>
          <p className="text-sm text-gray-400">Paid Events</p>
        </div>
        <div className="gradient-border p-4 text-center">
          <p className="text-2xl font-bold text-white">
            {events.filter((e) => Number(e.prizePool) === 0).length}
          </p>
          <p className="text-sm text-gray-400">Free Events</p>
        </div>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-6xl mb-4 block">📭</span>
          <h3 className="text-xl font-bold text-white mb-2">
            No Active Events
          </h3>
          <p className="text-gray-400 mb-6">
            There are no active prediction events at the moment.
          </p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 hover:from-blue-400 hover:via-purple-400 hover:to-emerald-400 text-white font-bold transition-all hover:shadow-xl hover:shadow-purple-500/30"
          >
            Refresh Events
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.eventId.toString()} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

interface EventCardProps {
  event: {
    eventId: bigint;
    creator: string;
    name: string;
    prizePool: bigint;
    prizeToken: string;
    deadline: bigint;
    mode: number;
    distributionType: number;
    finalized: boolean;
    totalParticipants: bigint;
    fixtureIds: bigint[];
  };
}

function EventCard({ event }: EventCardProps) {
  const isPaid = Number(event.prizePool) > 0;
  const timeRemaining = getTimeRemaining(event.deadline);
  const isExpiringSoon =
    Number(event.deadline) - Math.floor(Date.now() / 1000) < 86400; // Less than 24 hours

  return (
    <div className="gradient-border p-6 hover:shadow-xl hover:shadow-purple-500/20 transition-all group cursor-pointer">
      {/* Event Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
            {event.name}
          </h3>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                isPaid
                  ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30"
                  : "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30"
              }`}
            >
              {isPaid ? "💰 Paid" : "🎮 Free"}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {getEventMode(event.mode)}
            </span>
          </div>
        </div>
      </div>

      {/* Prize Pool */}
      {isPaid && (
        <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
          <p className="text-sm text-gray-400 mb-1">Prize Pool</p>
          <p className="text-2xl font-bold text-yellow-400">
            {formatUnits(event.prizePool, 6)} USDC
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {getDistributionType(event.distributionType)}
          </p>
        </div>
      )}

      {/* Event Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">Participants</p>
          <p className="text-lg font-bold text-white flex items-center gap-1">
            <span>👥</span>
            {event.totalParticipants.toString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-400 mb-1">Matches</p>
          <p className="text-lg font-bold text-white flex items-center gap-1">
            <span>⚽</span>
            {event.fixtureIds.length}
          </p>
        </div>
      </div>

      {/* Time Remaining */}
      <div
        className={`p-3 rounded-lg ${
          isExpiringSoon
            ? "bg-red-500/10 border border-red-500/30"
            : "bg-purple-500/10 border border-purple-500/30"
        }`}
      >
        <p className="text-sm text-gray-400 mb-1">Time Remaining</p>
        <p
          className={`text-lg font-bold ${
            isExpiringSoon ? "text-red-400" : "text-purple-400"
          } flex items-center gap-2`}
        >
          <span>{isExpiringSoon ? "⚠️" : "⏰"}</span>
          {timeRemaining}
        </p>
      </div>

      {/* Join Button */}
      <button className="w-full mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 hover:from-blue-400 hover:via-purple-400 hover:to-emerald-400 text-white font-bold transition-all hover:shadow-lg hover:shadow-purple-500/30 active:scale-[0.98]">
        View Details →
      </button>
    </div>
  );
}

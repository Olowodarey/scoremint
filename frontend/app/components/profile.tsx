"use client";

import React, { useState } from 'react';

interface UserStats {
  eventsWon: number;
  totalPredictions: number;
  points: number;
  winRate: number;
  currentStreak: number;
  rank: number;
}

interface Event {
  id: string;
  name: string;
  date: string;
  result: 'won' | 'lost' | 'pending';
  prediction: string;
  points: number;
}

const Profile = () => {
  // Mock data - in production, this would come from blockchain/API
  const [userStats] = useState<UserStats>({
    eventsWon: 12,
    totalPredictions: 45,
    points: 1580,
    winRate: 26.7,
    currentStreak: 3,
    rank: 127
  });

  const [recentEvents] = useState<Event[]>([
    {
      id: '1',
      name: 'Man City vs Arsenal',
      date: '2025-12-28',
      result: 'won',
      prediction: 'Man City 2-1',
      points: 150
    },
    {
      id: '2',
      name: 'Barcelona vs Real Madrid',
      date: '2025-12-25',
      result: 'won',
      prediction: 'Barcelona 3-2',
      points: 200
    },
    {
      id: '3',
      name: 'Liverpool vs Chelsea',
      date: '2025-12-22',
      result: 'won',
      prediction: 'Liverpool 1-0',
      points: 120
    },
    {
      id: '4',
      name: 'PSG vs Bayern',
      date: '2025-12-20',
      result: 'lost',
      prediction: 'PSG 2-2',
      points: 0
    },
    {
      id: '5',
      name: 'Juventus vs Milan',
      date: '2025-12-18',
      result: 'lost',
      prediction: 'Milan 2-1',
      points: 0
    }
  ]);

  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  return (
    <div className="pb-20 px-4">
      {/* Header Section */}
      <div className="py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            <span className="text-3xl">👤</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Prediction Master</h1>
            <p className="text-sm text-gray-400">0x742d...5f8a</p>
          </div>
        </div>
        
        <div className="glass-card px-4 py-2">
          <div className="text-xs text-gray-400">Global Rank</div>
          <div className="text-lg font-bold text-primary">#{userStats.rank}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl mb-1">🏆</div>
          <div className="text-2xl font-bold text-white">{userStats.eventsWon}</div>
          <div className="text-xs text-gray-400">Events Won</div>
        </div>

        <div className="glass-card p-4 text-center">
          <div className="text-2xl mb-1">🎯</div>
          <div className="text-2xl font-bold text-white">{userStats.totalPredictions}</div>
          <div className="text-xs text-gray-400">Total Predictions</div>
        </div>

        <div className="glass-card p-4 text-center">
          <div className="text-2xl mb-1">⭐</div>
          <div className="text-2xl font-bold text-white">{userStats.points.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Total Points</div>
        </div>

        <div className="glass-card p-4 text-center">
          <div className="text-2xl mb-1">📈</div>
          <div className="text-2xl font-bold text-white">{userStats.winRate}%</div>
          <div className="text-xs text-gray-400">Win Rate</div>
        </div>

        <div className="glass-card p-4 text-center">
          <div className="text-2xl mb-1">🔥</div>
          <div className="text-2xl font-bold text-white">{userStats.currentStreak}</div>
          <div className="text-xs text-gray-400">Current Streak</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10">
        <button
          className={`flex-1 py-3 font-semibold transition-colors ${
            activeTab === 'overview'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`flex-1 py-3 font-semibold transition-colors ${
            activeTab === 'history'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('history')}
        >
          Prediction History
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-lg font-bold text-white mb-4">Performance Overview</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Predictions Made</span>
                  <span className="text-white font-semibold">{userStats.totalPredictions}</span>
                </div>
                <div className="w-full h-2 bg-dark-lighter rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(userStats.totalPredictions / 100) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Events Won</span>
                  <span className="text-white font-semibold">{userStats.eventsWon}</span>
                </div>
                <div className="w-full h-2 bg-dark-lighter rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(userStats.eventsWon / userStats.totalPredictions) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Win Rate</span>
                  <span className="text-white font-semibold">{userStats.winRate}%</span>
                </div>
                <div className="w-full h-2 bg-dark-lighter rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${userStats.winRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-lg font-bold text-white mb-4">Achievements</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <span className="text-2xl">🎖️</span>
                <div className="flex-1">
                  <div className="text-white font-semibold">First Win</div>
                  <div className="text-xs text-gray-400">Win your first prediction</div>
                </div>
                <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">Unlocked</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <span className="text-2xl">🔥</span>
                <div className="flex-1">
                  <div className="text-white font-semibold">Hot Streak</div>
                  <div className="text-xs text-gray-400">Win 3 predictions in a row</div>
                </div>
                <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">Unlocked</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-dark-card/40 rounded-lg border border-white/10 opacity-50">
                <span className="text-2xl">💯</span>
                <div className="flex-1">
                  <div className="text-white font-semibold">Century</div>
                  <div className="text-xs text-gray-400">Make 100 predictions</div>
                </div>
                <span className="text-xs px-2 py-1 bg-gray-700 text-gray-400 rounded">Locked</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Recent Predictions</h3>
            <div className="flex gap-2">
              <button className="text-xs px-3 py-1 bg-primary text-white rounded-lg">All</button>
              <button className="text-xs px-3 py-1 bg-dark-card text-gray-400 rounded-lg hover:bg-white/5">Won</button>
              <button className="text-xs px-3 py-1 bg-dark-card text-gray-400 rounded-lg hover:bg-white/5">Lost</button>
            </div>
          </div>
          
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div key={event.id} className="glass-card p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-white font-semibold">{event.name}</h4>
                    <p className="text-xs text-gray-400">{new Date(event.date).toLocaleDateString()}</p>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    event.result === 'won' ? 'bg-green-500/20 text-green-400' :
                    event.result === 'lost' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {event.result === 'won' && '✓ Won'}
                    {event.result === 'lost' && '× Lost'}
                    {event.result === 'pending' && '⏳ Pending'}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs text-gray-400">Your Prediction: </span>
                    <span className="text-sm text-white">{event.prediction}</span>
                  </div>
                  <span className={`text-sm font-bold ${
                    event.result === 'won' ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    {event.result === 'won' ? '+' : ''}{event.points} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
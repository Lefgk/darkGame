export function HowToPlay() {
    return (
        <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-purple-500/20">
            <h3 className="text-3xl font-bold mb-6 text-purple-400">How to Play</h3>

            <div className="space-y-6">
                {/* Objective */}
                <section>
                    <h4 className="text-xl font-semibold mb-3 text-pink-400">🎯 Objective</h4>
                    <p className="text-gray-300">
                        Be the last ship standing in a deadly turn-based battle royale. Outmaneuver opponents, collect loot, and survive the shrinking zone to claim victory and massive rewards.
                    </p>
                </section>

                {/* Game Flow */}
                <section>
                    <h4 className="text-xl font-semibold mb-3 text-pink-400">🔄 Game Flow</h4>
                    <ol className="space-y-3 text-gray-300">
                        <li className="flex items-start">
                            <span className="font-bold text-purple-400 mr-2">1.</span>
                            <span><strong>Join Game:</strong> Pay 50 PLS entry fee and choose your ship class</span>
                        </li>
                        <li className="flex items-start">
                            <span className="font-bold text-purple-400 mr-2">2.</span>
                            <span><strong>Auto-Start:</strong> Game begins when 5-16 players join (or 10min timer expires)</span>
                        </li>
                        <li className="flex items-start">
                            <span className="font-bold text-purple-400 mr-2">3.</span>
                            <span><strong>Random Spawn:</strong> All ships spawn at random positions on an 8x8 grid</span>
                        </li>
                        <li className="flex items-start">
                            <span className="font-bold text-purple-400 mr-2">4.</span>
                            <span><strong>Take Turns:</strong> Each turn, move OR attack with your ship</span>
                        </li>
                        <li className="flex items-start">
                            <span className="font-bold text-purple-400 mr-2">5.</span>
                            <span><strong>Survive Zone:</strong> Every 10 turns, the safe zone shrinks—stay inside or take damage!</span>
                        </li>
                        <li className="flex items-start">
                            <span className="font-bold text-purple-400 mr-2">6.</span>
                            <span><strong>Collect Loot:</strong> Defeated players drop 25 PLS worth of loot</span>
                        </li>
                        <li className="flex items-start">
                            <span className="font-bold text-purple-400 mr-2">7.</span>
                            <span><strong>Win:</strong> Game ends when only 3 players remain—top 3 share the prize pool</span>
                        </li>
                    </ol>
                </section>

                {/* Turn Mechanics */}
                <section>
                    <h4 className="text-xl font-semibold mb-3 text-pink-400">⚡ Turn Mechanics</h4>
                    <div className="bg-gray-900/50 rounded-lg p-4 space-y-2 text-gray-300">
                        <p><strong className="text-purple-400">Turn Duration:</strong> 10 seconds (1 PulseChain block)</p>
                        <p><strong className="text-purple-400">Actions Per Turn:</strong> Move OR Attack (not both)</p>
                        <p><strong className="text-purple-400">Movement:</strong> Move up to your ship's speed in tiles (Chebyshev distance)</p>
                        <p><strong className="text-purple-400">Attacking:</strong> Attack any ship within your range</p>
                        <p><strong className="text-purple-400">Damage Variance:</strong> ±10% randomness on all attacks</p>
                    </div>
                </section>

                {/* Zone Mechanics */}
                <section>
                    <h4 className="text-xl font-semibold mb-3 text-pink-400">🔥 Zone Mechanics</h4>
                    <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-lg p-4 space-y-2 text-gray-300 border border-red-500/30">
                        <p><strong className="text-red-400">Zone Shrinks:</strong> Every 10 turns</p>
                        <p><strong className="text-red-400">Initial Size:</strong> 8x8 (full board)</p>
                        <p><strong className="text-red-400">Final Size:</strong> Collapses to center</p>
                        <p><strong className="text-red-400">Outside Damage:</strong> 10 HP per turn if outside safe zone</p>
                        <p className="text-yellow-400 font-semibold mt-3">⚠️ Stay in the zone or take continuous damage!</p>
                    </div>
                </section>

                {/* Prize Distribution */}
                <section>
                    <h4 className="text-xl font-semibold mb-3 text-pink-400">💰 Prize Distribution</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-600/20 rounded-lg p-4 border border-yellow-500/30">
                            <div className="text-4xl mb-2">🥇</div>
                            <div className="text-xl font-bold text-yellow-400">1st Place</div>
                            <div className="text-3xl font-bold text-white">54%</div>
                            <div className="text-sm text-gray-400">of prize pool</div>
                        </div>
                        <div className="bg-gradient-to-br from-gray-600/20 to-gray-400/20 rounded-lg p-4 border border-gray-500/30">
                            <div className="text-4xl mb-2">🥈</div>
                            <div className="text-xl font-bold text-gray-300">2nd Place</div>
                            <div className="text-3xl font-bold text-white">22.5%</div>
                            <div className="text-sm text-gray-400">of prize pool</div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-900/20 to-orange-600/20 rounded-lg p-4 border border-orange-500/30">
                            <div className="text-4xl mb-2">🥉</div>
                            <div className="text-xl font-bold text-orange-400">3rd Place</div>
                            <div className="text-3xl font-bold text-white">13.5%</div>
                            <div className="text-sm text-gray-400">of prize pool</div>
                        </div>
                    </div>
                    <p className="text-gray-400 mt-4 text-sm">
                        10% protocol fee • Loot drops add to prize pool • Each kill = +25 PLS bounty
                    </p>
                </section>

                {/* Strategy Tips */}
                <section>
                    <h4 className="text-xl font-semibold mb-3 text-pink-400">💡 Strategy Tips</h4>
                    <ul className="space-y-2 text-gray-300">
                        <li className="flex items-start">
                            <span className="text-purple-400 mr-2">▸</span>
                            <span><strong>Pick Your Ship Wisely:</strong> Titans are tanky but slow, Fighters are fast but fragile</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-purple-400 mr-2">▸</span>
                            <span><strong>Position is Key:</strong> Stay near the center to avoid zone damage</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-purple-400 mr-2">▸</span>
                            <span><strong>Hunt for Kills:</strong> Each kill drops loot and increases your score</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-purple-400 mr-2">▸</span>
                            <span><strong>Watch the Clock:</strong> Zone shrinks every 10 turns—plan ahead!</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-purple-400 mr-2">▸</span>
                            <span><strong>Top 3 Wins:</strong> You don't need to be #1 to profit—survival matters!</span>
                        </li>
                    </ul>
                </section>
            </div>
        </div>
    );
}

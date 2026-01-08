export function ShipClasses() {
    const ships = [
        {
            name: 'Titan',
            emoji: '🛡️',
            color: 'from-gray-600 to-gray-800',
            borderColor: 'border-gray-500',
            hp: 500,
            speed: 2,
            range: 2,
            damage: 50,
            description: 'The ultimate tank. Massive HP and damage, but slow movement.',
            pros: ['Highest HP', 'Highest damage', 'Great for frontline'],
            cons: ['Very slow', 'Easy to kite', 'Hard to escape zone'],
        },
        {
            name: 'Dreadnought',
            emoji: '🚢',
            color: 'from-blue-600 to-blue-800',
            borderColor: 'border-blue-500',
            hp: 350,
            speed: 3,
            range: 3,
            damage: 40,
            description: 'Balanced powerhouse with excellent range.',
            pros: ['Best range', 'Good HP', 'Versatile playstyle'],
            cons: ['Mediocre at everything', 'Jack of all trades'],
        },
        {
            name: 'Cruiser',
            emoji: '⚓',
            color: 'from-purple-600 to-purple-800',
            borderColor: 'border-purple-500',
            hp: 200,
            speed: 4,
            range: 2,
            damage: 30,
            description: 'Mobile and balanced. Great all-around pick.',
            pros: ['Fast movement', 'Decent damage', 'Good HP pool'],
            cons: ['Average range', 'No specialization'],
        },
        {
            name: 'Frigate',
            emoji: '🛥️',
            color: 'from-green-600 to-green-800',
            borderColor: 'border-green-500',
            hp: 120,
            speed: 5,
            range: 2,
            damage: 20,
            description: 'High mobility skirmisher. Hit and run tactics.',
            pros: ['Very fast', 'Good kiting ability', 'Zone control'],
            cons: ['Low HP', 'Low damage', 'Risky playstyle'],
        },
        {
            name: 'Fighter',
            emoji: '✈️',
            color: 'from-red-600 to-red-800',
            borderColor: 'border-red-500',
            hp: 50,
            speed: 6,
            range: 1,
            damage: 15,
            description: 'Lightning fast assassin. High risk, high reward.',
            pros: ['Fastest ship', 'Can dodge attacks', 'Loot collector'],
            cons: ['Very fragile', 'Low range', 'Melee only'],
        },
    ];

    return (
        <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-purple-500/20">
            <h3 className="text-3xl font-bold mb-6 text-purple-400">Ship Classes</h3>
            <p className="text-gray-300 mb-8">
                Choose your ship class wisely—each has unique strengths and weaknesses. Your playstyle should match your ship!
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {ships.map((ship) => (
                    <div
                        key={ship.name}
                        className={`bg-gradient-to-br ${ship.color} rounded-xl p-6 border-2 ${ship.borderColor} shadow-lg hover:scale-105 transition-transform`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <span className="text-5xl">{ship.emoji}</span>
                                <div>
                                    <h4 className="text-2xl font-bold text-white">{ship.name}</h4>
                                    <p className="text-sm text-gray-300">{ship.description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-black/30 rounded-lg p-3">
                                <div className="text-xs text-gray-400 mb-1">Health Points</div>
                                <div className="text-2xl font-bold text-red-400">{ship.hp} HP</div>
                            </div>
                            <div className="bg-black/30 rounded-lg p-3">
                                <div className="text-xs text-gray-400 mb-1">Movement Speed</div>
                                <div className="text-2xl font-bold text-blue-400">{ship.speed} tiles</div>
                            </div>
                            <div className="bg-black/30 rounded-lg p-3">
                                <div className="text-xs text-gray-400 mb-1">Attack Range</div>
                                <div className="text-2xl font-bold text-green-400">{ship.range} tiles</div>
                            </div>
                            <div className="bg-black/30 rounded-lg p-3">
                                <div className="text-xs text-gray-400 mb-1">Base Damage</div>
                                <div className="text-2xl font-bold text-orange-400">{ship.damage} DMG</div>
                            </div>
                        </div>

                        {/* Pros & Cons */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="text-xs font-semibold text-green-400 mb-2">✓ PROS</div>
                                <ul className="space-y-1">
                                    {ship.pros.map((pro) => (
                                        <li key={pro} className="text-xs text-gray-300">
                                            • {pro}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-red-400 mb-2">✗ CONS</div>
                                <ul className="space-y-1">
                                    {ship.cons.map((con) => (
                                        <li key={con} className="text-xs text-gray-300">
                                            • {con}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Comparison Table */}
            <div className="mt-8 bg-gray-900/50 rounded-lg p-6 border border-purple-500/20">
                <h4 className="text-xl font-bold mb-4 text-purple-400">Quick Comparison</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="text-left py-2 text-gray-400">Ship</th>
                                <th className="text-center py-2 text-gray-400">HP</th>
                                <th className="text-center py-2 text-gray-400">Speed</th>
                                <th className="text-center py-2 text-gray-400">Range</th>
                                <th className="text-center py-2 text-gray-400">Damage</th>
                                <th className="text-center py-2 text-gray-400">Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ships.map((ship) => (
                                <tr key={ship.name} className="border-b border-gray-800">
                                    <td className="py-3">
                                        <span className="mr-2">{ship.emoji}</span>
                                        <span className="font-semibold">{ship.name}</span>
                                    </td>
                                    <td className="text-center">{ship.hp}</td>
                                    <td className="text-center">{ship.speed}</td>
                                    <td className="text-center">{ship.range}</td>
                                    <td className="text-center">{ship.damage}</td>
                                    <td className="text-center">
                                        {'⭐'.repeat(Math.floor((ship.hp + ship.speed * 50 + ship.range * 50 + ship.damage * 5) / 150))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

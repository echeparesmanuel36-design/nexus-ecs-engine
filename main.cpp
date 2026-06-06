#include "nexus_core.hpp"
#include <chrono>
#include <iostream>

// 1. COMPONENTES: Estructuras de datos puros (Gana a Unreal en ligereza)
struct Transform {
    float x, y, z;
};

struct Physics3D {
    float vx, vy, vz;
    float mass;
};

struct RenderMesh {
    int mesh_id;
    int material_id;
};

int main() {
    std::cout << "========================================================\n";
    std::cout << "  NEXUS-ECS ENGINE // EL DETONANTE DE UNREAL INSTALADO  \n";
    std::cout << "========================================================\n";

    Nexus::Coordinator engine;

    // Generar 10,000 objetos complejos en la escena a velocidad absurda
    std::cout << "[NEXUS] Spawneando 10,000 entidades con componentes múltiples...\n";
    auto start_spawn = std::chrono::high_resolution_clock::now();

    for (size_t i = 0; i < 10000; ++i) {
        Nexus::Entity entity = engine.create_entity();
        
        // Le metemos posición, física y gráficos a cada uno
        engine.add_component(entity, Transform{static_cast<float>(i), 0.0f, 5.0f});
        engine.add_component(entity, Physics3D{0.1f, -0.5f, 0.0f, 1.0f});
        engine.add_component(entity, RenderMesh{101, 5});
    }

    auto end_spawn = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double, std::milli> spawn_time = end_spawn - start_spawn;
    std::cout << "[NEXUS] ¡10,000 Entidades creadas en solo " << spawn_time.count() << " ms!\n\n";

    // BUCLE DE RENDIMIENTO EXTREMO (El Sistema de físicas del juego)
    std::cout << "[NEXUS] Ejecutando simulación de físicas masiva...\n";
    auto start_sim = std::chrono::high_resolution_clock::now();

    float dt = 0.016f; // Simulando 60 FPS
    size_t entity_count = engine.total_entities();

    // Actualizamos las 10,000 entidades de golpe
    for (size_t i = 0; i < entity_count; ++i) {
        auto* transform = engine.get_component<Transform>(i);
        auto* physics = engine.get_component<Physics3D>(i);

        if (transform && physics) {
            transform->x += physics->vx * dt;
            transform->y += physics->vy * dt;
            transform->z += physics->vz * dt;
        }
    }

    auto end_sim = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double, std::milli> sim_time = end_sim - start_sim;
    
    std::cout << "[NEXUS] Simulación completada con éxito.\n";
    std::cout << "[BENCHMARK] Tiempo de procesamiento para 10k objetos: " << sim_time.count() << " ms.\n";
    std::cout << "========================================================\n";

    return 0;
}

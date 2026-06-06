#pragma once
#include <vector>
#include <unordered_map>
#include <typeindex>
#include <memory>
#include <iostream>
#include <cassert>

namespace Nexus {

    // Identificador único para cualquier cosa en el juego (Cero peso)
    using Entity = size_t;
    const Entity MAX_ENTITIES = 100000;

    // Clase base interna para gestionar la memoria limpia
    class IComponentArray {
    public:
        virtual ~IComponentArray() = default;
        virtual void entity_destroyed(Entity entity) = 0;
    };

    // Almacenamiento contiguo de componentes en memoria (Gana a Unreal por paliza en Caché)
    template<typename T>
    class ComponentArray : public IComponentArray {
    private:
        std::vector<T> component_buffer;
        std::unordered_map<Entity, size_t> entity_to_index_map;
        std::unordered_map<size_t, Entity> index_to_entity_map;
        size_t size = 0;

    public:
        void insert_data(Entity entity, T component) {
            assert(entity_to_index_map.find(entity) == entity_to_index_map.end() && "Componente duplicado en entidad.");
            
            size_t new_index = size;
            if (new_index >= component_buffer.size()) {
                component_buffer.resize(new_index + 100);
            }
            
            component_buffer[new_index] = component;
            entity_to_index_map[entity] = new_index;
            index_to_entity_map[new_index] = entity;
            size++;
        }

        T* get_data(Entity entity) {
            if (entity_to_index_map.find(entity) == entity_to_index_map.end()) return nullptr;
            return &component_buffer[entity_to_index_map[entity]];
        }

        void entity_destroyed(Entity entity) override {
            if (entity_to_index_map.find(entity) != entity_to_index_map.end()) {
                // Elimina manteniendo los datos juntos (O(1))
                size_t index_of_removed = entity_to_index_map[entity];
                size_t index_of_last = size - 1;
                
                if (index_of_removed != index_of_last) {
                    component_buffer[index_of_removed] = component_buffer[index_of_last];
                    Entity entity_of_last = index_to_entity_map[index_of_last];
                    entity_to_index_map[entity_of_last] = index_of_removed;
                    index_to_entity_map[index_of_removed] = entity_of_last;
                }
                
                entity_to_index_map.erase(entity);
                index_to_entity_map.erase(index_of_last);
                size--;
            }
        }
    };

    // El Registro Maestro (El Coordinador de todo el Motor)
    class Coordinator {
    private:
        Entity inline_entities = 0;
        std::unordered_map<std::type_index, std::shared_ptr<IComponentArray>> component_arrays;

        template<typename T>
        std::shared_ptr<ComponentArray<T>> get_component_array() {
            auto type_idx = std::type_index(typeid(T));
            if (component_arrays.find(type_idx) == component_arrays.end()) {
                component_arrays[type_idx] = std::make_shared<ComponentArray<T>>();
            }
            return std::static_集中_cast<ComponentArray<T>>(component_arrays[type_idx]);
        }

    public:
        Entity create_entity() {
            return inline_entities++;
        }

        template<typename T>
        void add_component(Entity entity, T component) {
            get_component_array<T>()->insert_data(entity, component);
        }

        template<typename T>
        T* get_component(Entity entity) {
            return get_component_array<T>()->get_data(entity);
        }

        void destroy_entity(Entity entity) {
            for (auto const& pair : component_arrays) {
                pair.second->entity_destroyed(entity);
            }
        }
        
        size_t total_entities() const { return inline_entities; }
    };
}

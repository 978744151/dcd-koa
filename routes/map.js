const Router = require('koa-router');
const mongoose = require('mongoose');
const Province = require('../models/Province');
const City = require('../models/City');
const District = require('../models/District');
const BrandStore = require('../models/BrandStore');
const Brand = require('../models/Brand');
const Mall = require('../models/Mall');

const router = new Router({
  prefix: '/api/map'
});

// 获取全国数据统计
router.get('/national', async (ctx) => {
  try {
    // 获取所有省份数据
    const provinces = await Province.find({ isActive: true });

    // 计算全国总数
    const totalBrands = provinces.reduce((sum, province) => sum + province.brandCount, 0);
    const totalMalls = provinces.reduce((sum, province) => sum + province.mallCount, 0);
    const totalDistricts = provinces.reduce((sum, province) => sum + province.districtCount, 0);

    ctx.body = {
      success: true,
      data: {
        totalProvinces: provinces.length,
        totalBrands,
        totalMalls,
        totalDistricts,
        provinces: provinces.map(province => ({
          id: province._id,
          name: province.name,
          code: province.code,
          brandCount: province.brandCount,
          mallCount: province.mallCount,
          districtCount: province.districtCount
        }))
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取全国数据失败',
      error: error.message
    };
  }
});

// 获取省份数据
router.get('/provinces', async (ctx) => {
  try {
    const { page = 1, limit = 0, search } = ctx.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const provinces = await Province.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    const total = await Province.countDocuments(query);

    ctx.body = {
      success: true,
      data: {
        provinces,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取省份数据失败',
      error: error.message
    };
  }
});

// 获取单个省份详情
router.get('/provinces/:id', async (ctx) => {
  try {
    const province = await Province.findById(ctx.params.id);
    if (!province) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: '省份不存在'
      };
      return;
    }

    // 获取该省份下的城市列表
    const cities = await City.find({ province: province._id, isActive: true })
      .select('name code brandCount mallCount districtCount')
      .sort({ name: 1 });

    ctx.body = {
      success: true,
      data: {
        province: {
          id: province._id,
          name: province.name,
          code: province.code,
          brandCount: province.brandCount,
          mallCount: province.mallCount,
          districtCount: province.districtCount
        },
        cities
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取省份详情失败',
      error: error.message
    };
  }
});

// 获取城市数据
router.get('/cities', async (ctx) => {
  try {
    const { page = 1, limit = 0, provinceId, search } = ctx.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };
    if (provinceId) {
      query.province = provinceId;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const cities = await City.find(query)
      .populate('province', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    const total = await City.countDocuments(query);

    ctx.body = {
      success: true,
      data: {
        cities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取城市数据失败',
      error: error.message
    };
  }
});

// 获取单个城市详情
router.get('/cities/:id', async (ctx) => {
  try {
    const city = await City.findById(ctx.params.id).populate('province', 'name');
    if (!city) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: '城市不存在'
      };
      return;
    }

    // 获取该城市下的区县列表
    const districts = await District.find({ city: city._id, isActive: true })
      .select('name code brandCount mallCount')
      .sort({ name: 1 });

    ctx.body = {
      success: true,
      data: {
        city: {
          id: city._id,
          name: city.name,
          code: city.code,
          province: city.province,
          brandCount: city.brandCount,
          mallCount: city.mallCount,
          districtCount: city.districtCount
        },
        districts
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取城市详情失败',
      error: error.message
    };
  }
});

// 获取区县数据
router.get('/districts', async (ctx) => {
  try {
    const { page = 1, limit = 0, cityId, provinceId, search } = ctx.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };
    if (cityId) {
      query.city = cityId;
    }
    if (provinceId) {
      query.province = provinceId;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const districts = await District.find(query)
      .populate('city', 'name')
      .populate('province', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    const total = await District.countDocuments(query);

    ctx.body = {
      success: true,
      data: {
        districts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取区县数据失败',
      error: error.message
    };
  }
});

// 获取品牌数据
router.get('/brands', async (ctx) => {
  try {
    const { page = 1, limit = 0, provinceId, cityId, districtId, search } = ctx.query;
    const skip = (page - 1) * limit;

    // 列表模式
    let query = { isActive: true };
    if (provinceId) query.province = provinceId;
    if (cityId) query.city = cityId;
    if (districtId) query.district = districtId;
    if (search) query.name = { $regex: search, $options: 'i' };

    const brands = await Brand.find(query)
      .populate('province', 'name')
      .populate('city', 'name')
      .populate('district', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // 为每个品牌添加门店数量
    const brandsWithStoreCount = await Promise.all(
      brands.map(async (brand) => {
        let storeQuery = { brand: brand._id, isActive: true };
        if (provinceId) storeQuery.province = provinceId;
        if (cityId) storeQuery.city = cityId;
        if (districtId) storeQuery.district = districtId;

        const storeCount = await BrandStore.countDocuments(storeQuery);

        return {
          ...brand.toObject(),
          storeCount
        };
      })
    );

    const total = await Brand.countDocuments(query);

    ctx.body = {
      success: true,
      data: {
        brands: brandsWithStoreCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取品牌数据失败',
      error: error.message
    };
  }
});

// 获取树形结构数据（省 -> 市 -> 区 -> 商场 -> 品牌）
router.get('/tree', async (ctx) => {
  try {
    const { provinceId, cityId, districtId, search, brandId, level = 3 } = ctx.query;
    const queryLevel = parseInt(level);

    // 第一步：获取所有省份的基础结构
    let provinceQuery = {};
    if (provinceId) provinceQuery._id = provinceId;

    const allProvinces = await Province.find(provinceQuery).sort({ code: 1 });

    // 根据level参数决定返回的层级深度
    if (queryLevel === 1) {
      // 只返回省份，包含统计信息
      const provinces = await Promise.all(allProvinces.map(async (province) => {
        // 统计该省份的商场和品牌数量
        let storeQuery = { isActive: true, province: province._id };
        if (brandId) {
          const brandStores = await BrandStore.find({ ...storeQuery, brand: brandId });
          const mallCount = new Set(brandStores.map(store => store.mall.toString())).size;
          const brandCount = brandId ? 1 : 0;

          return {
            _id: province._id,
            name: province.name,
            code: province.code,
            mallCount,
            brandCount,
            storeCount: brandStores.length
          };
        } else {
          const [mallCount, brandCount, storeCount] = await Promise.all([
            BrandStore.distinct('mall', storeQuery).then(malls => malls.length),
            BrandStore.distinct('brand', storeQuery).then(brands => brands.length),
            BrandStore.countDocuments(storeQuery)
          ]);

          return {
            _id: province._id,
            name: province.name,
            code: province.code,
            mallCount,
            brandCount,
            storeCount
          };
        }
      }));

      ctx.body = { success: true, data: { provinces } };
      return;
    }

    // 构建完整的省市区树形结构
    const provinces = await Promise.all(allProvinces.map(async (province) => {
      // 获取该省份下的所有城市
      let cityQuery = { province: province._id };
      if (cityId) cityQuery._id = cityId;

      const cities = await City.find(cityQuery).sort({ code: 1 });

      if (queryLevel === 2) {
        // 返回省市，包含统计信息
        const citiesData = await Promise.all(cities.map(async (city) => {
          let storeQuery = { isActive: true, province: province._id, city: city._id };

          if (brandId) {
            const brandStores = await BrandStore.find({ ...storeQuery, brand: brandId });
            const mallCount = new Set(brandStores.map(store => store.mall.toString())).size;
            const brandCount = brandId ? 1 : 0;

            return {
              _id: city._id,
              name: city.name,
              code: city.code,
              mallCount,
              brandCount,
              storeCount: brandStores.length
            };
          } else {
            const [mallCount, brandCount, storeCount] = await Promise.all([
              BrandStore.distinct('mall', storeQuery).then(malls => malls.length),
              BrandStore.distinct('brand', storeQuery).then(brands => brands.length),
              BrandStore.countDocuments(storeQuery)
            ]);

            return {
              _id: city._id,
              name: city.name,
              code: city.code,
              mallCount,
              brandCount,
              storeCount
            };
          }
        }));

        // 计算省份统计
        const provinceMallCount = citiesData.reduce((sum, city) => sum + city.mallCount, 0);
        const provinceBrandCount = citiesData.reduce((sum, city) => sum + city.brandCount, 0);
        const provinceStoreCount = citiesData.reduce((sum, city) => sum + city.storeCount, 0);

        return {
          _id: province._id,
          name: province.name,
          code: province.code,
          mallCount: provinceMallCount,
          brandCount: provinceBrandCount,
          storeCount: provinceStoreCount,
          cities: citiesData
        };
      }

      // level >= 3，返回省市区及商场品牌数据，包含统计信息
      const citiesWithDistricts = await Promise.all(cities.map(async (city) => {
        // 获取该城市下的所有区县
        let districtQuery = { city: city._id };
        if (districtId) districtQuery._id = districtId;

        const districts = await District.find(districtQuery).sort({ code: 1 });

        // 为每个区县获取商场和品牌数据
        const districtsWithMalls = await Promise.all(districts.map(async (district) => {
          // 构建门店查询条件
          let storeQuery = {
            isActive: true,
            province: province._id,
            city: city._id,
            district: district._id
          };

          // 获取该区县下的门店数据
          const storesPipeline = [
            { $match: storeQuery },
            { $lookup: { from: 'brands', localField: 'brand', foreignField: '_id', as: 'brand' } },
            { $unwind: '$brand' },
            ...(brandId ? [{ $match: { 'brand._id': new mongoose.Types.ObjectId(brandId) } }] : []),
            ...(search ? [{ $match: { 'brand.name': { $regex: search, $options: 'i' } } }] : []),
            { $lookup: { from: 'malls', localField: 'mall', foreignField: '_id', as: 'mall' } },
            { $unwind: '$mall' },
            {
              $group: {
                _id: '$mall._id',
                mall: { $first: '$mall' },
                brands: {
                  $addToSet: {
                    _id: '$brand._id',
                    name: '$brand.name',
                    code: '$brand.code'
                  }
                }
              }
            }
          ];

          const mallsWithBrands = await BrandStore.aggregate(storesPipeline);

          const malls = mallsWithBrands.map(m => ({
            _id: m.mall._id,
            name: m.mall.name,
            code: m.mall.code,
            brands: m.brands
          }));

          // 计算区县统计
          const mallCount = malls.length;
          const brandCount = new Set(malls.flatMap(m => m.brands.map(b => b._id.toString()))).size;
          const storeCount = await BrandStore.countDocuments(storeQuery);

          return {
            _id: district._id,
            name: district.name,
            code: district.code,
            mallCount,
            brandCount,
            storeCount,
            malls
          };
        }));

        // 同时获取该城市下直辖的商场（没有区县的情况）
        let directStoreQuery = {
          isActive: true,
          province: province._id,
          city: city._id,
          $or: [
            { district: { $exists: false } },
            { district: null }
          ]
        };

        const directStoresPipeline = [
          { $match: directStoreQuery },
          { $lookup: { from: 'brands', localField: 'brand', foreignField: '_id', as: 'brand' } },
          { $unwind: '$brand' },
          ...(brandId ? [{ $match: { 'brand._id': new mongoose.Types.ObjectId(brandId) } }] : []),
          ...(search ? [{ $match: { 'brand.name': { $regex: search, $options: 'i' } } }] : []),
          { $lookup: { from: 'malls', localField: 'mall', foreignField: '_id', as: 'mall' } },
          { $unwind: '$mall' },
          {
            $group: {
              _id: '$mall._id',
              mall: { $first: '$mall' },
              brands: {
                $addToSet: {
                  _id: '$brand._id',
                  name: '$brand.name',
                  code: '$brand.code'
                }
              }
            }
          }
        ];

        const directMallsWithBrands = await BrandStore.aggregate(directStoresPipeline);

        const directMalls = directMallsWithBrands.map(m => ({
          _id: m.mall._id,
          name: m.mall.name,
          code: m.mall.code,
          brands: m.brands
        }));

        // 计算城市统计（包含区县和直辖商场）
        const districtMallCount = districtsWithMalls.reduce((sum, d) => sum + d.mallCount, 0);
        const districtBrandCount = districtsWithMalls.reduce((sum, d) => sum + d.brandCount, 0);
        const districtStoreCount = districtsWithMalls.reduce((sum, d) => sum + d.storeCount, 0);

        const directMallCount = directMalls.length;
        const directBrandCount = new Set(directMalls.flatMap(m => m.brands.map(b => b._id.toString()))).size;
        const directStoreCount = await BrandStore.countDocuments(directStoreQuery);

        return {
          _id: city._id,
          name: city.name,
          code: city.code,
          mallCount: districtMallCount + directMallCount,
          brandCount: districtBrandCount + directBrandCount,
          storeCount: districtStoreCount + directStoreCount,
          districts: districtsWithMalls,
          malls: directMalls // 直辖商场
        };
      }));

      // 计算省份统计
      const provinceMallCount = citiesWithDistricts.reduce((sum, city) => sum + city.mallCount, 0);
      const provinceBrandCount = citiesWithDistricts.reduce((sum, city) => sum + city.brandCount, 0);
      const provinceStoreCount = citiesWithDistricts.reduce((sum, city) => sum + city.storeCount, 0);

      return {
        _id: province._id,
        name: province.name,
        code: province.code,
        mallCount: provinceMallCount,
        brandCount: provinceBrandCount,
        storeCount: provinceStoreCount,
        cities: citiesWithDistricts
      };
    }));

    ctx.body = { success: true, data: { provinces } };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取树形数据失败',
      error: error.message
    };
  }
});
// 获取省市区详情数据
router.get('/detail', async (ctx) => {
  try {
    const { provinceId, cityId, districtId, brandId, search, page = 1, limit = 20 } = ctx.query;
    const skip = (page - 1) * limit;

    if (!provinceId && !cityId && !districtId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: '请提供省份、城市或区县ID'
      };
      return;
    }

    // 构建查询条件
    let storeQuery = { isActive: true };
    if (provinceId) storeQuery.province = provinceId;
    if (cityId) storeQuery.city = cityId;
    if (districtId) storeQuery.district = districtId;
    if (brandId) storeQuery.brand = brandId;

    // 构建聚合管道
    const pipeline = [
      { $match: storeQuery },
      { $lookup: { from: 'brands', localField: 'brand', foreignField: '_id', as: 'brand' } },
      { $unwind: '$brand' },
      ...(search ? [{ $match: { 'brand.name': { $regex: search, $options: 'i' } } }] : []),
      { $lookup: { from: 'malls', localField: 'mall', foreignField: '_id', as: 'mall' } },
      { $unwind: '$mall' },
      { $lookup: { from: 'provinces', localField: 'province', foreignField: '_id', as: 'province' } },
      { $unwind: '$province' },
      { $lookup: { from: 'cities', localField: 'city', foreignField: '_id', as: 'city' } },
      { $unwind: '$city' },
      { $lookup: { from: 'districts', localField: 'district', foreignField: '_id', as: 'district' } },
      { $unwind: { path: '$district', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          isActive: 1,
          address: 1,
          phone: 1,
          openingHours: 1,
          createdAt: 1,
          updatedAt: 1,
          brand: {
            _id: '$brand._id',
            name: '$brand.name',
            code: '$brand.code',
            category: '$brand.category',
            website: '$brand.website',
            logo: '$brand.logo'
          },
          mall: {
            _id: '$mall._id',
            name: '$mall.name',
            code: '$mall.code',
            address: '$mall.address',
            phone: '$mall.phone'
          },
          province: {
            _id: '$province._id',
            name: '$province.name',
            code: '$province.code'
          },
          city: {
            _id: '$city._id',
            name: '$city.name',
            code: '$city.code'
          },
          district: {
            $cond: [
              { $ne: ['$district', null] },
              {
                _id: '$district._id',
                name: '$district.name',
                code: '$district.code'
              },
              null
            ]
          }
        }
      },
      { $sort: { 'brand.name': 1, 'mall.name': 1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ];

    // 获取详情数据
    const stores = await BrandStore.aggregate(pipeline);

    // 获取总数
    const totalPipeline = [
      { $match: storeQuery },
      { $lookup: { from: 'brands', localField: 'brand', foreignField: '_id', as: 'brand' } },
      { $unwind: '$brand' },
      ...(search ? [{ $match: { 'brand.name': { $regex: search, $options: 'i' } } }] : []),
      { $count: 'total' }
    ];

    const totalResult = await BrandStore.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // 获取统计信息
    const statsPipeline = [
      { $match: storeQuery },
      { $lookup: { from: 'brands', localField: 'brand', foreignField: '_id', as: 'brand' } },
      { $unwind: '$brand' },
      ...(search ? [{ $match: { 'brand.name': { $regex: search, $options: 'i' } } }] : []),
      {
        $group: {
          _id: null,
          mallCount: { $addToSet: '$mall' },
          brandCount: { $addToSet: '$brand' },
          storeCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          mallCount: { $size: '$mallCount' },
          brandCount: { $size: '$brandCount' },
          storeCount: 1
        }
      }
    ];

    const statsResult = await BrandStore.aggregate(statsPipeline);
    const stats = statsResult.length > 0 ? statsResult[0] : { mallCount: 0, brandCount: 0, storeCount: 0 };

    // 获取区域信息
    let regionInfo = {};
    if (provinceId) {
      const province = await Province.findById(provinceId);
      if (province) regionInfo.province = { _id: province._id, name: province.name, code: province.code };
    }
    if (cityId) {
      const city = await City.findById(cityId);
      if (city) regionInfo.city = { _id: city._id, name: city.name, code: city.code };
    }
    if (districtId) {
      const district = await District.findById(districtId);
      if (district) regionInfo.district = { _id: district._id, name: district.name, code: district.code };
    }

    ctx.body = {
      success: true,
      data: {
        stores,
        regionInfo,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取详情数据失败',
      error: error.message
    };
  }
});
// 获取商场数据
router.get('/malls', async (ctx) => {
  try {
    const { page = 1, limit = 0, provinceId, cityId, districtId, search } = ctx.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };
    if (provinceId) {
      query.province = provinceId;
    }
    if (cityId) {
      query.city = cityId;
    }
    if (districtId) {
      query.district = districtId;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const malls = await Mall.find(query)
      .populate('province', 'name')
      .populate('city', 'name')
      .populate('district', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Mall.countDocuments(query);

    ctx.body = {
      success: true,
      data: {
        malls,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取商场数据失败',
      error: error.message
    };
  }
});

// 获取统计数据
router.get('/statistics', async (ctx) => {
  try {
    const { provinceId, cityId, districtId } = ctx.query;

    let query = { isActive: true };
    if (provinceId) {
      query.province = provinceId;
    }
    if (cityId) {
      query.city = cityId;
    }
    if (districtId) {
      query.district = districtId;
    }

    const brandCount = await Brand.countDocuments(query);
    const mallCount = await Mall.countDocuments(query);

    ctx.body = {
      success: true,
      data: {
        brandCount,
        mallCount
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取统计数据失败',
      error: error.message
    };
  }
});

module.exports = router;